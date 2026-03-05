import os
from sentence_transformers import SentenceTransformer

def download_model():
    model_name = "sentence-transformers/all-MiniLM-L6-v2"
    local_path = "./local_models/all-MiniLM-L6-v2"
    
    if not os.path.exists(local_path):
        print(f"Downloading {model_name}...")
        model = SentenceTransformer(model_name)
        model.save(local_path)
        print(f"Model saved to {local_path}")
    else:
        print(f"Model already exists at {local_path}")

if __name__ == "__main__":
    download_model()
