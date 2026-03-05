import pandas as pd
import os


# These paths are set for your local environment but can be overriden in a notebook
DATASETS_DIR = r'c:\Users\pawan\Desktop\AI_KBG\final_datasets'
OUTPUT_DIR = r'c:\Users\pawan\Desktop\AI_KBG\sample_email_by_category'
SAMPLE_SIZE_PER_CATEGORY = 200

def create_synchronized_samples():
    """
    Creates a perfectly synchronized mini-dataset for experimentation.
    1. Samples 200 emails per category.
    2. Filters all related tables (employees, metrics, etc.) to match only the sample context.
    """
    
    print("--- Step 1: Sampling Emails ---")
    emails_cleaned_path = os.path.join(DATASETS_DIR, 'emails_cleaned.csv')
    if not os.path.exists(emails_cleaned_path):
        print(f"Error: Source file {emails_cleaned_path} not found.")
        return

    # Load and sample
    df_emails = pd.read_csv(emails_cleaned_path)
    # Perform stratified sampling
    sample_emails_df = df_emails.groupby('category', group_keys=False).apply(
        lambda x: x.sample(n=min(len(x), SAMPLE_SIZE_PER_CATEGORY), random_state=42)
    )
    
    # Save the Anchor file
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    sample_emails_path = os.path.join(OUTPUT_DIR, 'sample_email.csv')
    sample_emails_df.to_csv(sample_emails_path, index=False)
    print(f"Successfully saved 1,000 emails to {sample_emails_path}")


    # PREPARE FILTER KEYS
    # 1. message_ids for filtering email-specific tables
    sample_mids = set(sample_emails_df['message_id'].astype(str))
    
    # 2. email_addresses for filtering personal/metric tables
    # Clean and lowercase for robust matching
    involved_emails = set(sample_emails_df['from'].astype(str).str.lower().unique())
    involved_emails.update(sample_emails_df['to'].astype(str).str.lower().unique())
    
    print(f"Sync Keys: {len(sample_mids)} Message IDs | {len(involved_emails)} unique Email Addresses\n")


    # SYNC TASKS DEFINITION
    # Logic: Read 'input_file' from DATASETS_DIR -> Filter -> Save as 'output_file' in OUTPUT_DIR
    sync_tasks = [
        {
            'input_file': 'communications.csv',
            'output_file': 'sample_communications.csv',
            'filter_col': 'message_id',
            'filter_set': sample_mids
        },
        {
            'input_file': 'email_enrichment_features.csv',
            'output_file': 'sample_email_enrichment_features.csv',
            'filter_col': 'message_id',
            'filter_set': sample_mids
        },
        {
            'input_file': 'employees.csv',
            'output_file': 'sample_employees.csv',
            'filter_col': 'email_address',
            'filter_set': involved_emails
        },
        {
            'input_file': 'employee_metrics.csv',
            'output_file': 'sample_employee_metrics.csv',
            'filter_col': 'email_address',
            'filter_set': involved_emails
        },
        {
            'input_file': 'aggregated_communications.csv',
            'output_file': 'sample_aggregated_communications.csv',
            'filter_col': ['sender_email', 'receiver_email'],
            'filter_set': involved_emails,
            'mode': 'either' 
        }
    ]

    print("--- Step 2: Running Synchronization ---")
    for task in sync_tasks:
        infile = task['input_file']
        outfile = task['output_file']
        input_path = os.path.join(DATASETS_DIR, infile)
        
        if not os.path.exists(input_path):
            print(f"Skipping {infile}: Source file not found.")
            continue

        # Load original data
        df = pd.read_csv(input_path)
        
        # Apply Filtering Logic
        if isinstance(task['filter_col'], list):
            # Combined filtering for multiple columns (Sender OR Receiver)
            mask = df[task['filter_col'][0]].astype(str).str.lower().isin(task['filter_set']) | \
                   df[task['filter_col'][1]].astype(str).str.lower().isin(task['filter_set'])
            filtered_df = df[mask]
        else:
            # Single column filtering
            col = task['filter_col']
            # Ensure case-insensitive matching for emails, string matching for IDs
            if 'email' in col:
                filtered_df = df[df[col].astype(str).str.lower().isin(task['filter_set'])]
            else:
                filtered_df = df[df[col].astype(str).isin(task['filter_set'])]

        # Save the sample version
        output_path = os.path.join(OUTPUT_DIR, outfile)
        filtered_df.to_csv(output_path, index=False)
        print(f"Done: {infile} -> {outfile} ({len(filtered_df)} records)")

    print("\n--- Summary ---")
    print(f"All sample datasets are now generated in: {OUTPUT_DIR}")
    print("These files are perfectly linked via IDs and Email addresses.")

if __name__ == "__main__":
    create_synchronized_samples()
