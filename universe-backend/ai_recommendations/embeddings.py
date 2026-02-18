import os
os.environ.setdefault('USE_TF', '0')

import numpy as np

_model = None


def _get_model():
    global _model
    if _model is None:
        from sentence_transformers import SentenceTransformer
        _model = SentenceTransformer('all-MiniLM-L6-v2')
    return _model


def embed_text(text: str) -> np.ndarray:
    """Embed a single text string. Returns L2-normalized 384-dim vector."""
    model = _get_model()
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.astype(np.float32)


def embed_texts(texts: list[str]) -> np.ndarray:
    """Embed multiple text strings. Returns L2-normalized 384-dim vectors."""
    model = _get_model()
    embeddings = model.encode(texts, normalize_embeddings=True, batch_size=32)
    return embeddings.astype(np.float32)
