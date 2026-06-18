import os
import logging
import traceback
from dotenv import load_dotenv
import google.generativeai as genai
from typing import List, Dict, Any
from pathlib import Path
load_dotenv()
genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
print("GEMINI KEY FOUND:", bool(os.getenv("GEMINI_API_KEY")))
logger = logging.getLogger(__name__)


def generate_answer(query: str, n_results: int = 10, snippet_chars: int = 3000) -> Dict[str, Any]:
    """
    Robust RAG entrypoint with extensive logging and protected stages.

    Returns dict with keys: answer (str), sources (list), fallback (bool), model (str), debug (dict)
    Never raises; always returns a dict.
    """

    print("="*80)
    print("NEW REQUEST")
    print("Query:", query)
    print("Entering classifier")
    try:
        # Stage A: Query classification (greeting detection)
        def is_greeting(text: str) -> bool:
            greetings = [
                'hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening',
                'thanks', 'thank you', 'bye'
            ]
            t = (text or '').lower().strip()
            if not t:
                return False
            if t in greetings:
                return True
            for g in greetings:
                if t.startswith(g):
                    return True
            return False

        classifier_result = is_greeting(query)
        print("Classifier result:", classifier_result)
    except Exception as e:
        print("Classifier exception:", e)
        logger.exception("Classifier failed: %s", e)
        classifier_result = False

    # Prepare default response shape
    default_error = {
        'answer': 'Sorry, an internal error occurred while processing your request.',
        'sources': [],
        'fallback': True,
        'model': '',
        'debug': {}
    }

    sources: List[Dict[str, Any]] = []
    docs = []
    metadatas = []
    model_used = "smollm2:135m"
    if not model_used:
        model_used = "smollm2:135m"
          

    # Note: greeting branch removed — always perform retrieval then use Gemini

    # Stage B: Chroma retrieval
    print("Entering Chroma retrieval")
    try:
        try:
            from sentence_transformers import SentenceTransformer
            import chromadb
        except Exception as e:
            print("Import error for retrieval libs:", e)
            raise

        try:
            embed_model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
        except Exception as e:
            print("Embedding model load failed:", e)
            raise

        # Resolve ChromaDB path robustly to avoid relative-path issues when Django's CWD differs
        print("Current dir:", Path.cwd())
        env_path = os.getenv('CHROMA_DB_PATH')
        candidates = []
        if env_path:
            candidates.append(Path(env_path))
        # Path relative to current working dir (what existing code used)
        candidates.append(Path(os.getcwd()) / 'chroma_db')
        # Path relative to project root (two levels up from this file: backend/chatbot -> backend -> repo root)
        candidates.append(Path(__file__).resolve().parents[2] / 'chroma_db')

        client = None
        chosen_path = None
        collections_at_chosen = []

        for p in candidates:
            try:
                p_resolved = p.resolve()
            except Exception:
                p_resolved = p
            print("Checking ChromaDB candidate:", p_resolved)
            if p.exists():
                try:
                    c = chromadb.PersistentClient(path=str(p_resolved))
                    try:
                        cols = c.list_collections()
                        names = []
                        for cinfo in cols:
                            if isinstance(cinfo, dict) and 'name' in cinfo:
                                names.append(cinfo['name'])
                            elif hasattr(cinfo, 'name'):
                                names.append(getattr(cinfo, 'name'))
                        print("Collections at", p_resolved, ":", names)
                        # Prefer a candidate that actually contains collections.
                        if names:
                            client = c
                            chosen_path = p_resolved
                            collections_at_chosen = names
                            break
                        else:
                            print("No collections found at", p_resolved, ", trying next candidate")
                            # do not accept empty chroma_db directory; continue to next candidate
                            continue
                    except Exception as e:
                        print("Could not list collections at", p_resolved, ":", e)
                        # If listing failed but the DB opened, accept this client as a fallback
                        client = c
                        chosen_path = p_resolved
                        break
                except Exception as e:
                    print("Failed to open ChromaDB at", p_resolved, ":", e)

        # If no candidate existed or opened, attempt to open the repo-root chroma_db as a final fallback
        if client is None:
            fallback = Path(__file__).resolve().parents[2] / 'chroma_db'
            try:
                print("Falling back to:", fallback.resolve())
                client = chromadb.PersistentClient(path=str(fallback.resolve()))
                chosen_path = fallback.resolve()
                try:
                    cols = client.list_collections()
                    names = []
                    for cinfo in cols:
                        if isinstance(cinfo, dict) and 'name' in cinfo:
                            names.append(cinfo['name'])
                        elif hasattr(cinfo, 'name'):
                            names.append(getattr(cinfo, 'name'))
                    collections_at_chosen = names
                except Exception:
                    collections_at_chosen = []
            except Exception as e:
                print("ChromaDB connection failed at all candidate locations:", e)
                raise

        print("Using ChromaDB:", chosen_path)
        print("Collections found:", collections_at_chosen)

        collection_name = 'indian_laws'
        collection = None
        try:
            # Prefer listing collections to check existence
            try:
                cols = client.list_collections()
                names = []
                for c in cols:
                    if isinstance(c, dict) and 'name' in c:
                        names.append(c['name'])
                    elif hasattr(c, 'name'):
                        names.append(getattr(c, 'name'))
                if collection_name not in names:
                    return {
                        'answer': 'Legal knowledge base is empty. Please run build_index.py.',
                        'sources': [],
                        'fallback': True,
                        'model': 'gemini-2.5-flash'
                    }
                collection = client.get_collection(collection_name)
            except Exception:
                # Fallback: try direct get_collection and handle missing collection
                try:
                    collection = client.get_collection(collection_name)
                except Exception:
                    return {
                        'answer': 'Legal knowledge base is empty. Please run build_index.py.',
                        'sources': [],
                        'fallback': True,
                        'model': 'gemini-2.5-flash'
                    }
        except Exception as e:
            print("ChromaDB connection/collection failed:", e)
            raise

        try:
            query_embedding = embed_model.encode(query).tolist()
        except Exception as e:
            print("Embedding encode failed:", e)
            raise

        try:
            results = collection.query(query_embeddings=[query_embedding], n_results=n_results)
        except Exception as e:
            print("Collection query failed:", e)
            raise

        docs = results.get('documents', [[]])[0]
        metadatas = results.get('metadatas', [[]])[0]

        print("Retrieved raw chunks:", len(docs))

        # Build list of retrieved chunk objects
        retrieved = []
        for doc, meta in zip(docs, metadatas):
            if not meta:
                continue
            retrieved.append({
                'text': doc or '',
                'meta': meta
            })

        # Merge chunks belonging to same (act_name, section_number)
        grouped = {}
        for item in retrieved:
            meta = item['meta']
            act = meta.get('act_name') or meta.get('act') or meta.get('act_name')
            section = str(meta.get('section_number') or meta.get('section') or '')
            title = meta.get('title') or ''
            source = meta.get('source') or ''
            chunk_idx = meta.get('chunk_id')

            key = (act, section)
            grouped.setdefault(key, {
                'act': act,
                'section': section,
                'title': title,
                'source': source,
                'chunks': []
            })
            grouped[key]['chunks'].append((chunk_idx if chunk_idx is not None else 0, item['text']))

        # Reconstruct full sections by sorting chunks by chunk_id and concatenating
        merged_sections = []
        for key, info in grouped.items():
            chunks_sorted = sorted(info['chunks'], key=lambda x: (x[0] if isinstance(x[0], int) else 0))
            reconstructed = ''
            for _, txt in chunks_sorted:
                txt = (txt or '').strip()
                if not txt:
                    continue
                # avoid simple overlap duplicates: if txt already contained at end, skip
                if reconstructed.endswith(txt) or txt in reconstructed:
                    # skip exact duplicates
                    continue
                # If overlap causes repeated substring at boundary, trim common prefix
                if reconstructed and txt.startswith(reconstructed[-200:]):
                    # find overlap length
                    overlap_len = 0
                    max_check = min(len(reconstructed), len(txt), 1000)
                    for l in range(max_check, 0, -1):
                        if reconstructed.endswith(txt[:l]):
                            overlap_len = l
                            break
                    reconstructed += txt[overlap_len:]
                else:
                    # normal append with separator
                    if reconstructed:
                        reconstructed += "\n\n" + txt
                    else:
                        reconstructed = txt

            merged_sections.append({
                'act': info['act'],
                'section': info['section'],
                'title': info['title'],
                'source': info['source'],
                'text': reconstructed
            })

        print("Merged sections count:", len(merged_sections))

        # Deduplicate merged sections (act+section) and prepare sources
        seen = set()
        sources = []
        context_parts = []
        for sec in merged_sections:
            key = (sec['act'], sec['section'])
            if key in seen:
                continue
            seen.add(key)
            full_text = sec['text'] or ''
            snippet = full_text if len(full_text) <= snippet_chars else full_text[:snippet_chars]
            sources.append({
                'act': sec['act'],
                'section': sec['section'],
                'title': sec['title'],
                'source': sec['source'],
                'snippet': snippet,
                'full_text': full_text
            })

            context_parts.append(f"Act Name:\n{sec['act']}\n\nSection:\n{sec['section']}\n\nTitle:\n{sec['title']}\n\nComplete Text:\n{full_text}\n\n")

        context = "\n".join(context_parts)
        print("Prepared context from merged sections; citations:", len(sources))
    except Exception as e:
        print("Chroma retrieval exception:", repr(e))
        traceback.print_exc()
        logger.exception('Chroma retrieval failed: %s', e)
        # proceed — sources may be empty, but do not raise
        sources = []
        docs = []
        context = ''

    # Stage C: Gemini generation using retrieved context
    print("Entering Gemini generation")
    try:
        # Use the reconstructed full sections as context (prepared earlier)
        prompt = f"""
You are an Indian legal assistant.

Use ONLY the information below.

Context:
{context}

Question:
{query}

Rules:
- Answer in simple English.
- Mention Act name and Section if available.
- If context is empty, say:
    'No relevant legal provisions were found in the knowledge base.'
- Do not hallucinate.
"""

        try:
            model = genai.GenerativeModel("gemini-2.5-flash")
            response = model.generate_content(prompt)
            answer = response.text
            return {
                'answer': answer,
                'sources': sources,
                'fallback': False,
                'model': 'gemini-2.5-flash',
                'debug': {}
            }
        except Exception as e:
            return {
                'answer': 'Gemini generation failed.',
                'sources': sources,
                'fallback': True,
                'model': 'gemini-2.5-flash',
                'debug': {'error': str(e)}
            }
    except Exception as e:
        logger.exception('Gemini generation setup failed: %s', e)
        return {
            'answer': 'Gemini generation failed.',
            'sources': sources,
            'fallback': True,
            'model': 'gemini-2.5-flash',
            'debug': {'error': str(e)}
        }

    # Stage D: Fallback generation (synthesise from retrieved snippets)
    print("Entering fallback")
    print("Fallback sources:", len(sources))
    try:
        if not sources:
            fallback_text = "I could not find relevant provisions."
        else:
            parts = []
            for s in sources[:3]:
                act = s.get('act') or 'Unknown Act'
                section = s.get('section') or 'unknown'
                snippet = s.get('snippet') or ''
                snippet_short = snippet.replace('\n', ' ').strip()
                parts.append(f"{act} | Section {section}: {snippet_short}")
            fallback_text = "\n\n".join(parts)

        answer = fallback_text
        print("Returning response")
        print({
            'fallback': True,
            'answer_length': len(answer),
            'sources': len(sources)
        })
        return {
            'answer': fallback_text,
            'sources': sources,
            'fallback': True,
            'model': model_used,
            'debug': {'result_counts': len(docs)}
        }
    except Exception as e:
        print("Fallback exception:", repr(e))
        traceback.print_exc()
        logger.exception('Fallback generation failed: %s', e)
        # If even fallback fails, return safe generic message
        return default_error
