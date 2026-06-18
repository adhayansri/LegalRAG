from sentence_transformers import SentenceTransformer
import chromadb
import ollama


print("Loading embedding model...")

model = SentenceTransformer(
    "sentence-transformers/all-MiniLM-L6-v2"
)


print("Connecting to ChromaDB...")

client = chromadb.PersistentClient(
    path="./chroma_db"
)


collection = client.get_collection(
    "indian_laws"
)


while True:

    query = input("\nAsk : ")

    if query.lower() in ['exit', 'quit']:
        break


    print("\nSearching laws...")


    query_embedding = model.encode(
        query
    ).tolist()


    results = collection.query(

        query_embeddings=[query_embedding],

        n_results=5

    )


    context = ""

    sources = []


    for doc, meta in zip(

            results["documents"][0],

            results["metadatas"][0]

    ):


        context += f"""

Act:
{meta['act']}

Section:
{meta['section']}

Title:
{meta['title']}

Content:
{doc}


"""


        sources.append(

            f"{meta['act']} | Section {meta['section']}"

        )



    prompt = f"""
You are an Indian Legal Assistant.

Use ONLY the legal context provided.

Do not make assumptions.

If the answer is not present in the context, say:

"I could not find relevant provisions."



Legal Context:


{context}



Question:


{query}



Answer:
"""


    print("\nThinking...\n")


    response = ollama.chat(

        model='gemma2:2b',

        messages=[

            {

                'role': 'user',

                'content': prompt

            }

        ]

    )


    answer = response['message']['content']


    print("="*80)

    print("\nAI Answer\n")

    print(answer)


    print("\n")

    print("="*80)


    print("\nSources\n")


    for s in sources:

        print("•", s)


    print("\n")