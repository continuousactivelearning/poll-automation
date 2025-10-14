import json

def chunk_transcript(file_path, chunk_size=30):
    with open(file_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        text = data.get("content", "")

    words = text.split()
    chunks = [" ".join(words[i:i + chunk_size]) for i in range(0, len(words), chunk_size)]
    return chunks
