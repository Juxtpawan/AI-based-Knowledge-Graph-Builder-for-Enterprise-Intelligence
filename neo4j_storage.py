import os
import sys
import pandas as pd
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable
import numpy as np
from tqdm import tqdm
from dotenv import load_dotenv

# Load environment variables (.env file)
load_dotenv()

# UTILITIES

def clean_val(val, default=None):
    """Ensures value is a primitive type and handles NaN."""
    if pd.isna(val) or (isinstance(val, float) and np.isnan(val)):
        return default
    return val

def get_neo4j_driver():
    """Initializes and returns the Neo4j driver using environment variables."""
    uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
    user = os.getenv("NEO4J_USER", "neo4j")
    password = os.getenv("NEO4J_PASSWORD", "password")
    
    try:
        print(f"Connecting to Neo4j via Basic Auth (User: {user})")
        driver = GraphDatabase.driver(uri, auth=(user, password))
        driver.verify_connectivity()
        print(f"Connected to Neo4j at {uri}")
        return driver
    except ServiceUnavailable:
        print("\n[ERROR] Could not connect to Neo4j. Is your database running?")
        sys.exit(1)
    except Exception as e:
        print(f"\n[ERROR] Connection failed: {type(e).__name__}: {e}")
        if "DatabaseNotFound" in str(e):
            print("[TIP] This usually means 'neo4j' database name is incorrect for your instance. Try Aura credentials or check your local Neo4j desktop settings.")
        sys.exit(1)

def create_constraints(driver):
    """Sets up unique constraints to prevent duplicate nodes."""
    try:
        with driver.session() as session:
            session.run("CREATE CONSTRAINT person_email_unique IF NOT EXISTS FOR (p:Person) REQUIRE p.email IS UNIQUE")
            session.run("CREATE CONSTRAINT email_id_unique IF NOT EXISTS FOR (e:Email) REQUIRE e.message_id IS UNIQUE")
            session.run("CREATE CONSTRAINT entity_name_unique IF NOT EXISTS FOR (en:Entity) REQUIRE en.name IS UNIQUE")
            print("Database constraints verified.")
    except Exception as e:
        print(f"\n[FATAL ERROR] Constraint creation failed during run: {type(e).__name__}: {e}")
        raise

# INGESTION FUNCTIONS (Layer by Layer)

def import_people(driver, csv_path):
    """
    Step 1: Identity & Profiles
    Creates 'Person' nodes with HR metadata (Department, Job Title).
    """
    if not os.path.exists(csv_path):
        print(f"Skipping import_people: {csv_path} not found.")
        return
        
    df = pd.read_csv(csv_path)
    print(f"Importing {len(df)} People...")
    with driver.session() as session:
        for _, row in tqdm(df.iterrows(), total=len(df), desc="Nodes: People"):
            params = {
                "email_address": clean_val(row.get('email_address'), 'Unknown'),
                "name": clean_val(row.get('name'), 'Unknown'),
                "employee_id": clean_val(row.get('employee_id'), 'Unknown')
            }
            session.run("""
                MERGE (p:Person {email: $email_address})
                SET p.name = $name, 
                    p.employee_id = $employee_id
            """, **params)

def import_metrics(driver, csv_path):
    """
    Step 2: Behavioral Intelligence
    Attaches performance metrics (sent/received counts, diversity) directly to Person nodes.
    """
    if not os.path.exists(csv_path):
        print(f"Skipping import_metrics: {csv_path} not found.")
        return
        
    df = pd.read_csv(csv_path)
    with driver.session() as session:
        for _, row in tqdm(df.iterrows(), total=len(df), desc="Features: Employee Metrics"):
            params = {
                "email_address": clean_val(row.get('email_address')),
                "sent_count": int(clean_val(row.get('emails_sent_count'), 0)),
                "received_count": int(clean_val(row.get('emails_received_count'), 0)),
                "sent_to_unique": int(clean_val(row.get('sent_to_count'), 0)),
                "received_from_unique": int(clean_val(row.get('received_from_count'), 0)),
                "internal_sent": int(clean_val(row.get('internal_contacts_sent'), 0)),
                "external_sent": int(clean_val(row.get('external_contacts_sent'), 0)),
                "total_unique_contacts": int(clean_val(row.get('unique_contacts_total'), 0)),
                "avg_word_count": float(clean_val(row.get('avg_word_count'), 0.0)),
                "diversity_score": float(clean_val(row.get('diversity_score'), 0.0))
            }
            if not params["email_address"]: continue
            session.run("""
                MATCH (p:Person {email: $email_address})
                SET p.sent_count = $sent_count,
                    p.received_count = $received_count,
                    p.sent_to_unique = $sent_to_unique,
                    p.received_from_unique = $received_from_unique,
                    p.internal_sent = $internal_sent,
                    p.external_sent = $external_sent,
                    p.total_unique_contacts = $total_unique_contacts,
                    p.avg_word_count = $avg_word_count,
                    p.diversity_score = $diversity_score
            """, **params)

def import_emails(driver, csv_path):
    """
    Step 3: Communication Backbone
    Creates 'Email' nodes using metadata from the Anchor file.
    """
    if not os.path.exists(csv_path):
        print(f"Skipping import_emails: {csv_path} not found.")
        return
        
    df = pd.read_csv(csv_path)
    with driver.session() as session:
        batch_size = 500
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i : i + batch_size].to_dict('records')
            cleaned_batch = []
            for row in batch:
                cleaned_batch.append({
                    "message_id": clean_val(row.get('message_id'), 'Unknown'),
                    "timestamp": clean_val(row.get('timestamp'), 'Unknown'),
                    "subject": clean_val(row.get('subject'), ''),
                    "category": clean_val(row.get('category'), 'General'),
                    "year": int(clean_val(row.get('year'), 0)),
                    "month": int(clean_val(row.get('month'), 0)),
                    "day": int(clean_val(row.get('day'), 0)),
                    "hour": int(clean_val(row.get('hour'), 0)),
                    "weekday": clean_val(row.get('weekday'), 'Unknown')
                })
            session.run("""
                UNWIND $batch AS row
                MERGE (e:Email {message_id: row.message_id})
                SET e.date = row.timestamp,
                    e.subject = row.subject,
                    e.category = row.category,
                    e.year = row.year,
                    e.month = row.month,
                    e.day = row.day,
                    e.hour = row.hour,
                    e.weekday = row.weekday
            """, batch=cleaned_batch)

def import_comms_links(driver, csv_path):
    """
    Step 4: Network Connectivity
    Maps the precise 'SENT' and 'TO' relationships between People and Emails.
    """
    if not os.path.exists(csv_path):
        print(f"Skipping import_comms_links: {csv_path} not found.")
        return
        
    df = pd.read_csv(csv_path)
    with driver.session() as session:
        for _, row in tqdm(df.iterrows(), total=len(df), desc="Links: SENT/TO"):
            params = {
                "mid": clean_val(row.get('message_id')),
                "sender": clean_val(row.get('sender_email')),
                "receiver": clean_val(row.get('receiver_email')),
                "timestamp": clean_val(row.get('timestamp'), 'Unknown'),
                "comm_type": clean_val(row.get('communication_type'), 'Unknown')
            }
            if not all([params["mid"], params["sender"], params["receiver"]]): continue
            session.run("""
                MATCH (e:Email {message_id: $mid})
                MERGE (s:Person {email: $sender})
                MERGE (r:Person {email: $receiver})
                MERGE (s)-[relS:SENT]->(e)
                MERGE (e)-[relT:TO]->(r)
                SET relS.timestamp = $timestamp,
                    relS.communication_type = $comm_type,
                    relT.timestamp = $timestamp,
                    relT.communication_type = $comm_type
            """, **params)

def import_enrichment(driver, csv_path):
    """
    Step 5: Textual Context
    Attaches readability and complexity features to Email nodes for filtered querying.
    """
    if not os.path.exists(csv_path):
        print(f"Skipping import_enrichment: {csv_path} not found.")
        return
        
    df = pd.read_csv(csv_path)
    with driver.session() as session:
        for _, row in tqdm(df.iterrows(), total=len(df), desc="Features: Email Enrichment"):
            params = {
                "message_id": clean_val(row.get('message_id')),
                "word_count": int(clean_val(row.get('word_count'), 0)),
                "readability_score": float(clean_val(row.get('readability_score'), 0.0)),
                "complexity_rank": clean_val(row.get('complexity_rank'), 'Unknown')
            }
            if not params["message_id"]: continue
            session.run("""
                MATCH (e:Email {message_id: $message_id})
                SET e.word_count = $word_count,
                    e.readability_score = $readability_score,
                    e.complexity_rank = $complexity_rank
            """, **params)

def import_aggregated_comms(driver, csv_path):
    """
    Step 6: Relationship Map
    Creates weighted 'COMMUNICATES_WITH' links between people based on historical trends.
    """
    if not os.path.exists(csv_path):
        print(f"Skipping import_aggregated_comms: {csv_path} not found.")
        return
        
    df = pd.read_csv(csv_path)
    with driver.session() as session:
        for _, row in tqdm(df.iterrows(), total=len(df), desc="Links: Aggregated"):
            params = {
                "sender": clean_val(row.get('sender_email')),
                "receiver": clean_val(row.get('receiver_email')),
                "freq": int(clean_val(row.get('communication_frequency'), 0)),
                "first_contact": clean_val(row.get('first_contact'), 'Unknown'),
                "last_contact": clean_val(row.get('last_contact'), 'Unknown'),
                "comm_type": clean_val(row.get('communication_type'), 'Unknown'),
                "span_days": float(clean_val(row.get('temporal_span_days'), 0.0))
            }
            if not all([params["sender"], params["receiver"]]): continue
            session.run("""
                MERGE (s:Person {email: $sender})
                MERGE (r:Person {email: $receiver})
                MERGE (s)-[rel:COMMUNICATES_WITH]->(r)
                SET rel.frequency = $freq,
                    rel.first_contact = $first_contact,
                    rel.last_contact = $last_contact,
                    rel.communication_type = $comm_type,
                    rel.temporal_span_days = $span_days
            """, **params)

def import_triples(driver, csv_path):
    """
    Step 7 & 8: Triple Intelligence
    Ingests extracted triples: (Subject)-[Predicate]->(Object).
    Handles both Entity associations and Semantic relationships.
    """
    if not os.path.exists(csv_path):
        print(f"Extraction results not found yet: {csv_path}. Run extraction_engine.py first.")
        return

    df = pd.read_csv(csv_path)
    
    with driver.session() as session:
        batch_size = 500
        for i in tqdm(range(0, len(df), batch_size), desc=f"Intelligence: {os.path.basename(csv_path)}"):
            batch_df = df.iloc[i : i + batch_size]
            cleaned_batch = []
            
            for _, row in batch_df.iterrows():
                pred = clean_val(row.get('predicate'), 'RELATED_TO')
                entry = {
                    "message_id": str(clean_val(row.get('message_id'), 'Unknown')),
                    "predicate": str(pred)
                }
                
                if pred == "HAS_ENTITY":
                    entry.update({
                        "object": str(clean_val(row.get('object'), 'Unknown')),
                        "entity_type": str(clean_val(row.get('entity_type'), 'Entity'))
                    })
                else:
                    entry.update({
                        "subject": str(clean_val(row.get('subject'), 'Unknown')),
                        "subject_type": str(clean_val(row.get('subject_type'), 'Entity')),
                        "object": str(clean_val(row.get('object'), 'Unknown')),
                        "object_type": str(clean_val(row.get('object_type'), 'Entity'))
                    })
                cleaned_batch.append(entry)

            entities_batch = [r for r in cleaned_batch if r['predicate'] == "HAS_ENTITY"]
            rels_batch = [r for r in cleaned_batch if r['predicate'] != "HAS_ENTITY"]

            if entities_batch:
                session.run("""
                    UNWIND $batch AS row
                    MERGE (en:Entity {name: row.object})
                    SET en.type = row.entity_type
                    WITH en, row
                    OPTIONAL MATCH (e:Email {message_id: row.message_id})
                    FOREACH (i IN CASE WHEN e IS NOT NULL THEN [1] ELSE [] END |
                        MERGE (e)-[:EXTRACTED_ENTITY]->(en)
                    )
                """, batch=entities_batch)
            
            if rels_batch:
                session.run("""
                    UNWIND $batch AS row
                    MERGE (s:Entity {name: row.subject})
                    SET s.type = row.subject_type
                    MERGE (o:Entity {name: row.object})
                    SET o.type = row.object_type
                    WITH s, o, row
                    MERGE (s)-[rel:RELATED_TO]->(o)
                    SET rel.predicate = row.predicate, 
                        rel.message_id = row.message_id
                """, batch=rels_batch)

# MAIN EXECUTION BLAST (Notebook Friendly)

def clear_database(driver):
    """Optional: Wipes existing results for a clean construction run."""
    print("Clearing existing data for a fresh build...")
    with driver.session() as session:
        session.run("MATCH (n) DETACH DELETE n")

def build_full_graph():
    """Main workflow orchestration."""
    driver = get_neo4j_driver()
    
    try:
        # Step 0: Clean and Constrain
        clear_database(driver)
        create_constraints(driver)
        print("\nStarting Knowledge Graph Construction")
        
        # Identity Layer
        import_people(driver, "sample_email_by_category/sample_employees.csv")
        import_metrics(driver, "sample_email_by_category/sample_employee_metrics.csv")
        
        # Communication Backbone Layer
        import_emails(driver, "sample_email_by_category/sample_email.csv")
        import_comms_links(driver, "sample_email_by_category/sample_communications.csv")
        import_enrichment(driver, "sample_email_by_category/sample_email_enrichment_features.csv")
        
        # Network Layer
        import_aggregated_comms(driver, "sample_email_by_category/sample_aggregated_communications.csv")
        
        # Intelligence Layer
        import_triples(driver, "NER/entities/entities.csv")
        import_triples(driver, "NER/relationships/relationships.csv")
        
        print("\nKnowledge Graph Construction Complete.")
    finally:
        driver.close()

if __name__ == "__main__":
    build_full_graph()
