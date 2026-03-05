import os
import time
import json
import pandas as pd
# from langchain_groq import ChatGroq
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from pydantic import BaseModel, Field
from typing import List
from tqdm import tqdm
from dotenv import load_dotenv


# Load environment variables
load_dotenv()

# Define Pydantic models for Extraction for Structured data
class Entity(BaseModel):
    message_id: str = Field(description="The unique ID of the email")
    entity: str = Field(description="The specific text identified as an entity (use FULL names if possible)")
    entity_type: str = Field(description="The category of the entity (e.g., PERSON, ORGANIZATION, STRATEGY, DEAL_ID, GEOGRAPHIC_LOCATION, LEGAL_TERM, COMMODITY, PLANT, CASE_NUMBER, JOB_TITLE, CURRENCY)")

class Relationship(BaseModel):
    message_id: str = Field(description="The unique ID of the email")
    subject: str = Field(description="The source entity name")
    subject_type: str = Field(description="The type/category of the subject entity")
    predicate: str = Field(description="The relationship type (e.g., WORKS_FOR, LOCATED_IN, TRADED_BY, SUBPOENAED_BY, REPORTS_TO, INVOICED_BY, DISCUSSED_IN, INVOLVED_IN_STRATEGY, PARTICIPANT_IN)")
    object: str = Field(description="The target entity name")
    object_type: str = Field(description="The type/category of the object entity")

class BatchExtraction(BaseModel):
    entities: List[Entity]
    relationships: List[Relationship]

# Initialize LangChain Gemini model
api_key = os.getenv("GEMINI_AI_API_KEY")
if not api_key:
    raise ValueError("GEMINI_AI_API_KEY not found in environment variables.")

llm = ChatGoogleGenerativeAI(
    model="gemini-2.5-flash-lite",
    google_api_key=api_key,
    temperature=0
)

# Set up parser and prompt
parser = JsonOutputParser(pydantic_object=BatchExtraction)

prompt = ChatPromptTemplate.from_template(
    """
    You are an Expert Forensic Linguist. 
    Your mission is to perform high-precision Named Entity Recognition (NER) and Relationship Extraction (RE) to build a Knowledge Graph.

    ### EXTRACTION PROTOCOLS:
    3. **Entity-Triple Linkage**: Every entity used in Task 2 MUST be defined as an entity in Task 1 with a consistent 'entity_type'.
    4. **Type Accuracy**: Ensure `subject_type` and `object_type` in relationships match the `entity_type` from Task 1.
    5. **No Hallucinations**: Extract ONLY facts explicitly stated. Do not infer links.
    6. **ID Mapping**: Each extraction must strictly reference the correct `message_id`.

    ### TASK 1: Named Entity Recognition (NER)
    Extract significant entities based on the email domain:
    - **General**: `PERSON`, `ORGANIZATION`, `GEOGRAPHIC_LOCATION`, `STRATEGY`.
    - **Energy Trading**: `COMMODITY`, `PLANT`, `POWER_GRID`, `ISO_RTO`.
    - **Legal/Compliance**: `CASE_NUMBER`, `LAW_FIRM`, `JURISDICTION`, `REGULATION`, `LEGAL_TERM`.
    - **HR**: `JOB_TITLE`, `RESUME_ID`, `BENEFIT_PLAN`, `OFFER_STATUS`.
    - **Financial**: `ACCOUNT_NUMBER`, `CURRENCY`, `TRANSACTION_TYPE`, `ASSET_CLASS`, `DEAL_ID`.

    ### TASK 2: Relationship Extraction (Triples)
    Format: (Subject Entity) - [Predicate] -> (Object Entity).
    Sub-category Predicates:
    - **General**: `WORKS_FOR`, `LOCATED_IN`, `PARTICIPANT_IN`, `HAS_COMMUNICATION`.
    - **Energy Trading**: `TRADED_BY`, `PRICE_FOR`, `HEDGED_WITH`, `SUPPLIED_TO`.
    - **Legal**: `SUBPOENAED_BY`, `COMPLIES_WITH`, `LITIGATED_BY`, `REPRESENTED_BY`.
    - **HR**: `REPORTS_TO`, `APPROVED_BY`, `HIRED_FOR`, `STAKEHOLDER_IN`.
    - **Financial**: `INVOICED_BY`, `AUDITED_IN`, `BALANCE_OF`, `TRANSFERRED_TO`.

    {format_instructions}
    
    Email Data for Processing:
    ---
    {text_batch}
    ---
    """
)

chain = prompt | llm | parser

def extract_batch(batch_rows):
    """
    Extracts entities and relationships from a batch of emails.
    """
    text_batch = "\n\n".join([f"ID: {row['message_id']}\nCategory: {row['category']}\nBody: {row['body_cleaned']}" for _, row in batch_rows.iterrows()])
    
    attempt = 0
    base_delay = 10
    
    while True:
        try:
            print(f"Submitting batch of {len(batch_rows)} emails to LLM for NER...")
            response = chain.invoke({
                "text_batch": text_batch,
                "format_instructions": parser.get_format_instructions()
            })
            entities = response.get("entities", [])
            relationships = response.get("relationships", [])
            print(f"Received {len(entities)} entities and {len(relationships)} relationships.")
            return entities, relationships
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "RESOURCE_EXHAUSTED" in error_str:
                attempt += 1
                delay = min(base_delay * (2 ** (attempt - 1)), 300)
                print(f"Rate limit hit. Retrying in {delay}s... (Total Retries: {attempt})")
                time.sleep(delay)
            else:
                print(f"Error extracting batch: {e}")
                return [], []

def load_checkpoint(checkpoint_file):
    if os.path.exists(checkpoint_file):
        try:
            with open(checkpoint_file, 'r') as f:
                content = f.read().strip()
                if not content:
                    return -1
                return json.loads(content).get("last_processed_index", -1)
        except Exception:
            return -1
    return -1

def save_checkpoint(checkpoint_file, last_index):
    with open(checkpoint_file, 'w') as f:
        json.dump({"last_processed_index": last_index, "timestamp": time.ctime()}, f)

def process_emails_serial(input_csv, entities_csv, relationships_csv, checkpoint_file, batch_size=15):
    """
    Process emails in batches for NER and Relationship extraction.
    """
    # Ensure directories exist
    os.makedirs(os.path.dirname(entities_csv), exist_ok=True)
    os.makedirs(os.path.dirname(relationships_csv), exist_ok=True)
    print(f"Loading {input_csv}...")
    df = pd.read_csv(input_csv)
    df = df[df['body_cleaned'].notna()]
    
    total_records = len(df)
    last_index = load_checkpoint(checkpoint_file)
    start_index = last_index + 1
    
    print(f"Resuming NER extraction from index {start_index} out of {total_records}...")

    min_request_interval = 60 / 6 # 6 RPM safety
    last_request_start = 0

    if start_index >= total_records:
        print("All emails processed.")
        return

    i = start_index
    while i < total_records:
        elapsed = time.time() - last_request_start
        if elapsed < min_request_interval:
            time.sleep(min_request_interval - elapsed)
        
        last_request_start = time.time()
        
        end_idx = min(i + batch_size, total_records)
        batch_rows = df.iloc[i : end_idx]
        
        print(f"\n--- Processing BATCH: Indices {i} to {end_idx-1} ---")
        entities, relationships = extract_batch(batch_rows)
        
        if entities or relationships:
            if entities:
                ent_triples = []
                for ent in entities:
                    ent_data = ent if isinstance(ent, dict) else ent.model_dump()
                    ent_triples.append({
                        # "subject": ent_data.get('message_id', 'Unknown'), # REMOVED REDUNDANCY
                        "predicate": "HAS_ENTITY",
                        "object": ent_data.get('entity', 'Unknown'),
                        "entity_type": ent_data.get('entity_type', 'Entity'),
                        "message_id": ent_data.get('message_id', 'Unknown')
                    })
                if ent_triples:
                    ent_df = pd.DataFrame(ent_triples)
                    ent_df.to_csv(entities_csv, mode='a', index=False, header=not os.path.exists(entities_csv))
            
            if relationships:
                rel_triples = []
                for rel in relationships:
                    rel_data = rel if isinstance(rel, dict) else rel.model_dump()
                    rel_triples.append({
                        "subject": rel_data.get('subject', 'Unknown'),
                        "subject_type": rel_data.get('subject_type', 'Entity'),
                        "predicate": rel_data.get('predicate', 'RELATED_TO'),
                        "object": rel_data.get('object', 'Unknown'),
                        "object_type": rel_data.get('object_type', 'Entity'),
                        "message_id": rel_data.get('message_id', 'Unknown')
                    })
                if rel_triples:
                    rel_df = pd.DataFrame(rel_triples)
                    rel_df.to_csv(relationships_csv, mode='a', index=False, header=not os.path.exists(relationships_csv))
                
            save_checkpoint(checkpoint_file, end_idx - 1)
            print(f"Processed email index {end_idx-1}. Checkpoint updated.")
            
            # Rate Limiting: Sleep to stay within 15 RPM limit and minimize TPM
            print("Rate Limiting: Waiting 30 seconds before next batch...")
            time.sleep(30) 
            
            # ADVANCE TO THE NEXT BATCH
            i = end_idx
            
        else:
            print(f"Failed batch at index {i}. Retrying SAME BATCH in 15 seconds to ensure no data is skipped...")
            time.sleep(60)
            
    print(f"\nExtraction complete. Entities: {entities_csv}, Relationships: {relationships_csv}")

if __name__ == "__main__":
    # Settings for the sampling task
    input_path = "sample_email_by_category/sample_email.csv"
    entities_path = "NER/entities/entities.csv"
    relationships_path = "NER/relationships/relationships.csv"
    checkpoint_path = "extraction_checkpoint.json"
    
    process_emails_serial(input_path, entities_path, relationships_path, checkpoint_path, batch_size=10)
