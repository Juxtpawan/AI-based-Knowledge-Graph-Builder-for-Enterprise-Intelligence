# Sample Email Datasets (Processed)

This directory contains the cleaned and enriched datasets derived from the Enron email corpus. These files are used as the primary data source for the Knowledge Graph and RAG pipeline.

## 📂 File Descriptions

### 1. `sample_email.csv`
The core dataset containing cleaned email content.
- **`message_id`**: Unique identifier for each email.
- **`body_cleaned`**: The original email body with headers, quotes, and boilerplate removed.
- **`subject`**: The subject line of the email.
- **`category`**: The thematic category assigned during preprocessing.

### 2. `sample_employees.csv`
Identity mapping for individuals found in the communication network.
- **`email_address`**: The primary key for each person.
- **`name`**: The extracted or inferred name of the employee.
- **`employee_id`**: An MD5 hash used for privacy-preserving unique identification.

### 3. `sample_communications.csv`
The raw communication links between senders and receivers.
- **`message_id`**: Links the communication to a specific email.
- **`sender_email`**: The originator of the message.
- **`receiver_email`**: The intended recipient.
- **`communication_type`**: Classified as 'internal' or 'external'.

### 4. `sample_employee_metrics.csv`
Aggregated behavioral data for each employee.
- **`sent_count`**: Total number of emails sent.
- **`received_count`**: Total number of emails received.
- **`diversity_score`**: A measure of the variety of unique contacts.

### 5. `sample_aggregated_communications.csv`
Higher-level relationship data for the Knowledge Graph.
- **`communication_frequency`**: The total count of interactions between two people.
- **`first_contact` / `last_contact`**: Temporal bounds of the relationship.

### 6. `sample_email_enrichment_features.csv`
NLP-derived features for advanced filtering.
- **`word_count`**: The length of the cleaned message.
- **`email_length`**: Qualitative length classification (Short, Medium, Long).
- **`communication_time_category`**: Classification based on time of day (Morning, Afternoon, etc.).
