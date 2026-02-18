import os
import numpy as np
import faiss
from django.conf import settings

FAISS_DIR = os.path.join(settings.BASE_DIR, 'faiss_indexes')

# In-memory cache: {index_name: (faiss_index, id_list)}
_index_cache = {}


def _get_index_path(index_name):
    return os.path.join(FAISS_DIR, f'{index_name}.index')


def _get_ids_path(index_name):
    return os.path.join(FAISS_DIR, f'{index_name}_ids.npy')


def build_index(index_name, embeddings, ids):
    """
    Build a FAISS IndexFlatIP (inner product) index and persist to disk.

    Args:
        index_name: Name of the index (e.g., 'housing', 'marketplace')
        embeddings: numpy array of shape (N, 384) with L2-normalized vectors
        ids: list of integer IDs corresponding to embeddings
    """
    os.makedirs(FAISS_DIR, exist_ok=True)

    if len(embeddings) == 0:
        return

    dim = embeddings.shape[1]
    index = faiss.IndexFlatIP(dim)
    index.add(embeddings)

    faiss.write_index(index, _get_index_path(index_name))
    np.save(_get_ids_path(index_name), np.array(ids))

    # Update cache
    _index_cache[index_name] = (index, list(ids))


def load_index(index_name):
    """
    Load a FAISS index from disk, using in-memory cache.

    Returns:
        (faiss_index, id_list) or (None, None) if not found
    """
    if index_name in _index_cache:
        return _index_cache[index_name]

    index_path = _get_index_path(index_name)
    ids_path = _get_ids_path(index_name)

    if not os.path.exists(index_path) or not os.path.exists(ids_path):
        return None, None

    index = faiss.read_index(index_path)
    ids = np.load(ids_path).tolist()

    _index_cache[index_name] = (index, ids)
    return index, ids


def search_similar(index_name, query_embedding, top_k=10, exclude_ids=None):
    """
    Search for similar items in a FAISS index.

    Args:
        index_name: Name of the index
        query_embedding: numpy array of shape (384,) — L2-normalized
        top_k: Number of results to return
        exclude_ids: Set of IDs to exclude from results

    Returns:
        List of (id, score) tuples, sorted by similarity (descending)
    """
    index, ids = load_index(index_name)
    if index is None:
        return []

    exclude_ids = exclude_ids or set()

    # Request more results than needed to account for exclusions
    search_k = min(top_k + len(exclude_ids) + 5, index.ntotal)

    query = query_embedding.reshape(1, -1).astype(np.float32)
    scores, indices = index.search(query, search_k)

    results = []
    for score, idx in zip(scores[0], indices[0]):
        if idx < 0 or idx >= len(ids):
            continue
        item_id = ids[idx]
        if item_id in exclude_ids:
            continue
        results.append((item_id, float(score)))
        if len(results) >= top_k:
            break

    return results


def invalidate_cache(index_name=None):
    """Remove cached index(es) to force reload on next search."""
    if index_name:
        _index_cache.pop(index_name, None)
    else:
        _index_cache.clear()
