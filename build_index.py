import json
import chromadb
from sentence_transformers import SentenceTransformer
import uuid


def split_section(content: str, min_size: int = 1500, max_size: int = 2000, overlap: int = 350):
    """Split a long section into chunks trying to preserve sentence boundaries.

    - If content <= max_size -> return single chunk.
    - Otherwise create sliding window chunks of size ~max_size with given overlap.
    - Try to cut at nearest sentence boundary ('.', '\n') before the cutoff.
    """
    if not content:
        return []

    L = len(content)
    if L <= max_size:
        return [content]

    chunks = []
    start = 0
    while start < L:
        end = min(start + max_size, L)

        # try to find a sentence boundary before end but after start+min_size*0.6
        preferred_cut_min = int(start + (max_size * 0.6))
        cut_pos = None
        for sep in ['\n\n', '\n', '. ', '; ', '? ', '! ']:
            idx = content.rfind(sep, start, end)
            if idx != -1 and idx >= preferred_cut_min:
                cut_pos = idx + len(sep)
                break

        if cut_pos is None:
            # fallback: look for any separator between start and end
            for sep in ['\n\n', '\n', '. ', '; ', '? ', '! ']:
                idx = content.rfind(sep, start, end)
                if idx != -1:
                    cut_pos = idx + len(sep)
                    break

        if cut_pos is None:
            cut_pos = end

        chunk_text = content[start:cut_pos].strip()
        if chunk_text:
            chunks.append(chunk_text)

        # advance start using overlap
        if cut_pos >= L:
            break
        start = max(cut_pos - overlap, cut_pos - int(overlap / 2))

    return chunks


print("Loading model...")
model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

print("Loading sections from chunks.json...")
with open("chunks.json", "r", encoding="utf-8") as f:
    sections = json.load(f)

client = chromadb.PersistentClient(path="./chroma_db")

collection = client.get_or_create_collection(name="indian_laws")

batch_size = 100

docs_to_index = []

# Chunking parameters
MIN_CHUNK = 1500
MAX_CHUNK = 2000
OVERLAP = 350

for sec in sections:
    act_name = sec.get("act") or sec.get("act_name") or "Unknown Act"
    section_number = str(sec.get("section") or sec.get("section_number") or "")
    title = sec.get("title") or ""
    source = sec.get("source") or sec.get("source_file") or "chunks.json"
    content = sec.get("content") or ""

    piece_texts = split_section(content, min_size=MIN_CHUNK, max_size=MAX_CHUNK, overlap=OVERLAP)

    for idx, piece in enumerate(piece_texts):
        chunk_id = str(uuid.uuid4())
        docs_to_index.append({
            "id": chunk_id,
            "content": piece,
            "metadata": {
                "act_name": act_name,
                "section_number": section_number,
                "title": title,
                "source": source,
                "chunk_id": idx
            }
        })

print(f"Prepared {len(docs_to_index)} chunks to index")

for i in range(0, len(docs_to_index), batch_size):

    batch = docs_to_index[i:i+batch_size]

    docs = [x["content"] for x in batch]

    embeddings = model.encode(docs, show_progress_bar=False).tolist()

    ids = [x["id"] for x in batch]

    metadatas = [x["metadata"] for x in batch]

    collection.add(ids=ids, documents=docs, embeddings=embeddings, metadatas=metadatas)

    print(f"Indexed {min(i+batch_size,len(docs_to_index))}/{len(docs_to_index)}")

print("Finished!")