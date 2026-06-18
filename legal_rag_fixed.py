import json
from pathlib import Path
from bs4 import BeautifulSoup


def clean_html(text):
    if not text:
        return ""
    return BeautifulSoup(text, "html.parser").get_text(" ", strip=True)


def extract_sections(node, act_name, chunks):

    if not isinstance(node, dict):
        return

    if node.get("type") == "section":

        chunks.append({
            "act": act_name,
            "section": node.get("number"),
            "title": node.get("name"),
            "content": clean_html(node.get("content", ""))
        })

    for child in node.get("children", []):
        extract_sections(child, act_name, chunks)


def extract_chunks(folder):

    chunks = []

    for file in Path(folder).glob("*.json"):

        print(f"\nProcessing {file.name}")

        try:
            with open(file, "r", encoding="utf-8") as f:
                data = json.load(f)

        except Exception as e:
            print("Error:", e)
            continue

        acts = data if isinstance(data, list) else [data]

        before = len(chunks)

        for act in acts:

            if not isinstance(act, dict):
                continue

            act_name = act.get("name", file.stem)

            extract_sections(
                act,
                act_name,
                chunks
            )

        added = len(chunks) - before

        print(f"Sections found: {added}")

    return chunks


chunks = extract_chunks("data")

print("\nTOTAL CHUNKS:", len(chunks))

import json

with open("chunks.json", "w", encoding="utf-8") as f:
    json.dump(chunks, f, ensure_ascii=False, indent=2)

print("Saved to chunks.json")