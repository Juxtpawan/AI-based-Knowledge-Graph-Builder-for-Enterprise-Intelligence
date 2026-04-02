"""Neo4j Knowledge Graph Ingestion Pipeline.

This script orchestrates the transformation of cleaned enterprise datasets into a 
structured Knowledge Graph in Neo4j. It processes data in multiple layers:
1. Identity & Profiles (Employees)
2. Behavioral Metrics (Sent/Received counts, diversity scores)
3. Communication Backbone (Emails & SENT/TO/RECEIVED links)
4. Aggregated Networks (COMMUNICATES_WITH)
5. NLP Enrichment (Word counts, time categories)
6. Intelligence Layer (AI-extracted semantic triples)

All operations are designed to be idempotent and batch-oriented for performance. 
"""

import os
import sys
import time
import pandas as pd
import numpy as np
from neo4j import GraphDatabase
from neo4j.exceptions import ServiceUnavailable
from dotenv import load_dotenv
from pathlib import Path




# Load credentials from .env file
load_dotenv()


def clean_val(val, default=None):
    """Ensures a value is a primitive Neo4j-compatible type and handles NaN.
    
    Args:
        val: The input value to clean (e.g., from a pandas DataFrame).
        default: The fallback value if the input is NaN/null.
        
    Returns:
        The cleaned value or the default fallback.
    """
    if pd.isna(val) or (isinstance(val, float) and np.isnan(val)):
        return default
    return val


def get_neo4j_driver():
    """Initializes and returns the Neo4j driver using environment variables.
    
    Uses NEO4J_URI, NEO4J_USER, and NEO4J_PASSWORD from the environment.
    Retries connectivity verification before returning the driver.
    
    Returns:
        GraphDatabase.driver: An initialized Neo4j driver.
    """
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
        sys.exit(1)


def clear_database(driver):
    """Deletes all nodes and relationships from the database.
    
    Ensures a fresh state before re-running the full ingestion pipeline.
    
    Args:
        driver: An active Neo4j driver instance.
    """
    try:
        with driver.session() as session:
            print("Clearing existing data from Neo4j...")
            session.run("MATCH (n) DETACH DELETE n")
            print("Database cleared successfully.")
    except Exception as e:
        print(f"\n[WARNING] Could not clear database: {e}")



def create_constraints(driver):
    """Sets up unique constraints and indexes for data integrity and performance.
    
    Constraints:
        - Employee(email) UNIQUE
        - Email(message_id) UNIQUE
        - Entity(name) UNIQUE
    Indexes:
        - Email(category)
        - Entity(entity_type)
        
    Args:
        driver: An active Neo4j driver instance.
    """
    try:
        with driver.session() as session:
            # Constraints
            session.run("CREATE CONSTRAINT employee_email_unique IF NOT EXISTS FOR (p:Employee) REQUIRE p.email IS UNIQUE")
            session.run("CREATE CONSTRAINT email_id_unique IF NOT EXISTS FOR (e:Email) REQUIRE e.message_id IS UNIQUE")
            session.run("CREATE CONSTRAINT entity_name_unique IF NOT EXISTS FOR (en:Entity) REQUIRE en.name IS UNIQUE")
            
            # Additional Indexes for performance
            session.run("CREATE INDEX email_category_index IF NOT EXISTS FOR (e:Email) ON (e.category)")
            session.run("CREATE INDEX entity_type_index IF NOT EXISTS FOR (en:Entity) ON (en.entity_type)")
            
            print("Database constraints and indexes verified.")
    except Exception as e:
        print(f"\n[WARNING] Constraint/Index creation encountered an issue: {e}")


# SETUP 

def import_people(driver, csv_path):
    """Creates Employee nodes from sample_employees.csv.
    
    Each employee is identified uniquely by their email address.
    Stores name and a privacy-preserving MD5 employee_id.
    
    Args:
        driver: An active Neo4j driver instance.
        csv_path (str): Path to the CSV file containing employee data.
    """
    if not os.path.exists(csv_path):
        print(f"Skipping import_people: {csv_path} not found.")
        return
        
    df = pd.read_csv(csv_path)
    print(f"Importing {len(df)} People...")
    
    batch_size = 1000
    with driver.session() as session:
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i : i + batch_size].to_dict('records')
            cleaned_batch = []
            for row in batch:
                cleaned_batch.append({
                    "email": clean_val(row.get('email_address'), 'Unknown'),
                    "name": clean_val(row.get('name'), 'Unknown'),
                    "employee_id": clean_val(row.get('employee_id'), 'Unknown')
                })
            
            session.run("""
                UNWIND $batch AS row
                MERGE (p:Employee {email: row.email})
                SET p.name = row.name, 
                    p.employee_id = row.employee_id
            """, batch=cleaned_batch)



# IDENTITY & PROFILES

def import_metrics(driver, csv_path):
    """Enriches existing Employee nodes with behavioral email metrics.

    Because this runs after import_people, it uses MATCH (not MERGE) to ensure
    metrics are only attached to already-created Employee nodes.
    Metrics include sent/received counts, unique contact diversity, etc.
    
    Args:
        driver: An active Neo4j driver instance.
        csv_path (str): Path to the CSV file containing employee metrics.
    """
    if not os.path.exists(csv_path):
        print(f"Skipping import_metrics: {csv_path} not found.")
        return
        
    df = pd.read_csv(csv_path)
    print(f"Importing Metrics for {len(df)} People...")
    
    batch_size = 1000
    with driver.session() as session:
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i : i + batch_size].to_dict('records')
            cleaned_batch = []
            for row in batch:
                email = clean_val(row.get('email_address'))
                if not email: continue
                cleaned_batch.append({
                    "email": email,
                    "sent_count": int(clean_val(row.get('emails_sent_count'), 0)),
                    "received_count": int(clean_val(row.get('emails_received_count'), 0)),
                    "sent_to_unique": int(clean_val(row.get('sent_to_count'), 0)),
                    "received_from_unique": int(clean_val(row.get('received_from_count'), 0)),
                    "internal_sent": int(clean_val(row.get('internal_contacts_sent'), 0)),
                    "external_sent": int(clean_val(row.get('external_contacts_sent'), 0)),
                    "total_unique_contacts": int(clean_val(row.get('unique_contacts_total'), 0)),
                    "avg_word_count": float(clean_val(row.get('avg_word_count'), 0.0)),
                    "diversity_score": float(clean_val(row.get('diversity_score'), 0.0))
                })
            
            session.run("""
                UNWIND $batch AS row
                MATCH (p:Employee {email: row.email})
                SET p.sent_count = row.sent_count,
                    p.received_count = row.received_count,
                    p.sent_to_unique = row.sent_to_unique,
                    p.received_from_unique = row.received_from_unique,
                    p.internal_sent = row.internal_sent,
                    p.external_sent = row.external_sent,
                    p.total_unique_contacts = row.total_unique_contacts,
                    p.avg_word_count = row.avg_word_count,
                    p.diversity_score = row.diversity_score
            """, batch=cleaned_batch)



# COMMUNICATION BACKBONE

def import_emails(driver, csv_path):
    """Creates Email nodes from sample_email.csv.

    Each email is uniquely identified by message_id.
    Stores subject, category, and temporal metadata (year, month, hour, weekday).
    
    Args:
        driver: An active Neo4j driver instance.
        csv_path (str): Path to the CSV file containing email metadata.
    """
    if not os.path.exists(csv_path):
        print(f"Skipping import_emails: {csv_path} not found.")
        return
        
    df = pd.read_csv(csv_path)
    print(f"Importing {len(df)} Email metadata...")
    
    batch_size = 1000
    with driver.session() as session:
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
    """Creates SENT, TO, and RECEIVED relationships between Employees and Emails.

    For each email: 
      - Employee -[SENT]-> Email (sender side)
      - Email -[TO]-> Employee (receiver side)
      - Employee -[RECEIVED]-> Email (receiver side perspective)
      
    Args:
        driver: An active Neo4j driver instance.
        csv_path (str): Path to the CSV file containing communication links.
    """
    if not os.path.exists(csv_path):
        print(f"Skipping import_comms_links: {csv_path} not found.")
        return
        
    df = pd.read_csv(csv_path)
    print(f"Linking {len(df)} SENT/TO relationships...")
    
    batch_size = 1000
    with driver.session() as session:
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i : i + batch_size].to_dict('records')
            cleaned_batch = []
            for row in batch:
                mid = clean_val(row.get('message_id'))
                sender = clean_val(row.get('sender_email'))
                receiver = clean_val(row.get('receiver_email'))
                if not all([mid, sender, receiver]): continue
                
                cleaned_batch.append({
                    "mid": mid,
                    "sender": sender,
                    "receiver": receiver,
                    "timestamp": clean_val(row.get('timestamp'), 'Unknown'),
                    "comm_type": clean_val(row.get('communication_type'), 'Unknown')
                })
            
            session.run("""
                UNWIND $batch AS row
                MATCH (e:Email {message_id: row.mid})
                MERGE (s:Employee {email: row.sender})
                MERGE (r:Employee {email: row.receiver})
                MERGE (s)-[relS:SENT]->(e)
                MERGE (e)-[relT:TO]->(r)
                MERGE (r)-[relR:RECEIVED]->(e)
                SET relS.timestamp = row.timestamp,
                    relS.communication_type = row.comm_type,
                    relT.timestamp = row.timestamp,
                    relT.communication_type = row.comm_type,
                    relR.timestamp = row.timestamp,
                    relR.communication_type = row.comm_type
            """, batch=cleaned_batch)


def import_aggregated_comms(driver, csv_path):
    """Creates COMMUNICATES_WITH edges between Employee nodes.

    Unlike import_comms_links (which links per-email), this creates a single 
    aggregated edge between two employees with cumulative metadata:
      - frequency: total interaction count
      - first_contact/last_contact: temporal bounds of the relationship
      
    Args:
        driver: An active Neo4j driver instance.
        csv_path (str): Path to the CSV with aggregated communication data.
    """
    if not os.path.exists(csv_path):
        print(f"Skipping import_aggregated_comms: {csv_path} not found.")
        return
    
    df = pd.read_csv(csv_path)
    print(f"Importing {len(df)} aggregated communication links...")
    
    batch_size = 1000
    with driver.session() as session:
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i : i + batch_size].to_dict('records')
            cleaned_batch = []
            for row in batch:
                sender = clean_val(row.get('sender_email'))
                receiver = clean_val(row.get('receiver_email'))
                if not sender or not receiver:
                    continue
                cleaned_batch.append({
                    "sender": sender,
                    "receiver": receiver,
                    "frequency": int(clean_val(row.get('communication_frequency'), 0)),
                    "first_contact": str(clean_val(row.get('first_contact'), 'Unknown')),
                    "last_contact": str(clean_val(row.get('last_contact'), 'Unknown')),
                })

            if cleaned_batch:
                session.run("""
                    UNWIND $batch AS row
                    MERGE (s:Employee {email: row.sender})
                    MERGE (r:Employee {email: row.receiver})
                    MERGE (s)-[rel:COMMUNICATES_WITH]->(r)
                    SET rel.frequency = row.frequency,
                        rel.first_contact = row.first_contact,
                        rel.last_contact = row.last_contact
                """, batch=cleaned_batch)



# EMAIL ENRICHMENT

def import_enrichment_features(driver, csv_path):
    """Adds NLP-derived properties to existing Email nodes.

    Enriches each Email with:
      - word_count: number of words in the cleaned body
      - email_length: qualitatively defined length (Short, Medium, Long)
      - time_category: time-of-day label (e.g., morning)
      
    Args:
        driver: An active Neo4j driver instance.
        csv_path (str): Path to the CSV with NLP enrichment data.
    """
    if not os.path.exists(csv_path):
        print(f"Skipping import_enrichment_features: {csv_path} not found.")
        return

    df = pd.read_csv(csv_path)
    print(f"Enriching {len(df)} Email nodes with NLP features...")

    batch_size = 1000
    with driver.session() as session:
        for i in range(0, len(df), batch_size):
            batch = df.iloc[i : i + batch_size].to_dict('records')
            cleaned_batch = []
            for row in batch:
                mid = clean_val(row.get('message_id'))
                if not mid:
                    continue
                cleaned_batch.append({
                    "message_id": str(mid),
                    "word_count": int(clean_val(row.get('word_count'), 0)),
                    "email_length": int(clean_val(row.get('email_length'), 0)),
                    "time_category": str(clean_val(row.get('communication_time_category'), 'Unknown')),
                })

            if cleaned_batch:
                session.run("""
                    UNWIND $batch AS row
                    MATCH (e:Email {message_id: row.message_id})
                    SET e.word_count = row.word_count,
                        e.email_length = row.email_length,
                        e.time_category = row.time_category
                """, batch=cleaned_batch)



# INTELLIGENCE (AI-EXTRACTED TRIPLES)

def import_triples(driver, entities_csv, relationships_csv):
    """Ingests AI-extracted entities and semantic relationships into the graph.

    Logic:
      1 - Entities: Creates Entity nodes and links them to their source Email 
               via HAS_ENTITY relationship. Identity is based on entity 'name'.
      2 - Relationships: Creates triples between existing Entity nodes. 
               Uses target predicate as dynamic Neo4j relationship type.
               
    Args:
        driver: An active Neo4j driver instance.
        entities_csv (str): Path to CSV containing AI-extracted entities.
        relationships_csv (str): Path to CSV containing AI-extracted relationships.
    """
     # 1: Entity Nodes + HAS_ENTITY edges
    if os.path.exists(entities_csv):
        df_ent = pd.read_csv(entities_csv)
        print(f"Ingesting {len(df_ent)} entities from {entities_csv}...")
        batch_size = 1000
        with driver.session() as session:
            for i in range(0, len(df_ent), batch_size):
                batch = df_ent.iloc[i : i + batch_size].to_dict('records')
                cleaned_batch = []
                for row in batch:
                    cleaned_batch.append({
                        "message_id": str(clean_val(row.get('message_id'), 'Unknown')),
                        "name": str(clean_val(row.get('object'), 'Unknown')), # CSV column is 'object'
                        "type": str(clean_val(row.get('entity_type'), 'Entity'))
                    })
                
                session.run("""
                    UNWIND $batch AS row
                    MERGE (en:Entity {name: row.name})
                    ON CREATE SET en.entity_type = row.type
                    WITH en, row
                    MATCH (e:Email {message_id: row.message_id})
                    MERGE (e)-[:HAS_ENTITY]->(en)
                """, batch=cleaned_batch)

     # 2: Semantic Relationships (Entity -> Entity)
    if os.path.exists(relationships_csv):
        df_rel = pd.read_csv(relationships_csv)
        print(f"Ingesting {len(df_rel)} relationships from {relationships_csv}...")
        batch_size = 1000
        with driver.session() as session:
            for i in range(0, len(df_rel), batch_size):
                batch = df_rel.iloc[i : i + batch_size].to_dict('records')
                # Group by predicate within the batch to handle dynamic relationship types in Neo4j
                grouped_rels = {}
                for row in batch:
                    # Sanitize predicate for use as relationship type (uppercase, underscore instead of space)
                    pred = str(clean_val(row.get('predicate'), 'RELATED_TO')).strip().replace(' ', '_').replace('.', '_').upper()
                    if not pred or pred == 'NAN': pred = 'RELATED_TO'
                    
                    if pred not in grouped_rels:
                        grouped_rels[pred] = []
                    grouped_rels[pred].append({
                        "message_id": str(clean_val(row.get('message_id'), 'Unknown')),
                        "subject": str(clean_val(row.get('subject'), 'Unknown')),
                        "object": str(clean_val(row.get('object'), 'Unknown'))
                    })
                
                for rel_type, rel_batch in grouped_rels.items():
                    session.run(f"""
                        UNWIND $batch AS row
                        MERGE (s:Entity {{name: row.subject}})
                        MERGE (o:Entity {{name: row.object}})
                        WITH s, o, row
                        MERGE (s)-[rel:`{rel_type}` {{message_id: row.message_id}}]->(o)
                    """, batch=rel_batch)




# Building Graph

def build_full_graph():
    """Orchestrates the Knowledge Graph build in layered order.

    Layers & Sequence:
      0. Setup: Clear DB and create unique constraints/indexes.
      1. Profiles: Load Employees and attach behavioral metrics.
      2. Emails: Load metadata and link to Employees (SENT/TO/RECEIVED).
      3. Networks: Create COMMUNICATES_WITH links between Employees.
      4. Features: Enriched Email nodes with NLP classifications.
      5. Intelligence: Ingest AI-extracted entity-relationship knowledge.
    """
    driver = get_neo4j_driver()
    
    BASE_DIR = Path(__file__).resolve().parent.parent
    
    try:
        print("\n--- Starting Knowledge Graph Construction ---")
        start_time = time.time()
        
        # Setup
        clear_database(driver)
        create_constraints(driver)
        
        # Identity & Profiles
        import_people(driver, str(BASE_DIR / "data" / "processed" / "emails" / "sample_employees.csv"))
        import_metrics(driver, str(BASE_DIR / "data" / "processed" / "emails" / "sample_employee_metrics.csv"))
        
        # Communication Backbone
        import_emails(driver, str(BASE_DIR / "data" / "processed" / "emails" / "sample_email.csv"))
        import_comms_links(driver, str(BASE_DIR / "data" / "processed" / "emails" / "sample_communications.csv"))

        # Aggregated Links (COMMUNICATES_WITH between Persons)
        import_aggregated_comms(driver, str(BASE_DIR / "data" / "processed" / "emails" / "sample_aggregated_communications.csv"))

        # Email NLP Enrichment
        import_enrichment_features(driver, str(BASE_DIR / "data" / "processed" / "emails" / "sample_email_enrichment_features.csv"))

        # Intelligence (Extracted Data)
        import_triples(driver, str(BASE_DIR / "data" / "kg_data" / "entities.csv"), str(BASE_DIR / "data" / "kg_data" / "relationships.csv"))
        
        elapsed = time.time() - start_time
        print(f"\nKnowledge Graph Construction Complete in {elapsed:.2f} seconds.")
        
    finally:
        driver.close()



if __name__ == "__main__":
    build_full_graph()