import logging
import math
from typing import List

logger = logging.getLogger("researchhub.vector_store")

# Attempt to load numpy and sentence-transformers
model = None
has_transformers = False

try:
    import numpy as np
    from sentence_transformers import SentenceTransformer
    
    # Initialize the model (lazy loading is safer, but we can do it at import in a try-except)
    logger.info("Initializing SentenceTransformer model 'all-MiniLM-L6-v2'...")
    model = SentenceTransformer("all-MiniLM-L6-v2")
    has_transformers = True
    logger.info("SentenceTransformer model loaded successfully.")
except Exception as e:
    logger.warning(f"Could not load SentenceTransformers or NumPy: {e}. Falling back to lightweight hash-based embedding simulation.")
    has_transformers = False

def get_embedding(text: str) -> List[float]:
    """
    Computes a 384-dimensional float vector for a given text.
    If SentenceTransformers is loaded, generates semantic embeddings.
    Otherwise, generates a normalized fallback bag-of-words/hash representation.
    """
    if not text:
        return [0.0] * 384

    if has_transformers and model is not None:
        try:
            # Generate embedding
            emb = model.encode(text, convert_to_numpy=True)
            return emb.tolist()
        except Exception as err:
            logger.error(f"Error generating SentenceTransformer embedding: {err}. Using fallback.")

    # Fallback: Hash-based 384-dimensional unit vector
    return _generate_fallback_embedding(text)

def compute_cosine_similarity(vec1: List[float], vec2: List[float]) -> float:
    """
    Computes cosine similarity between two 384-dimensional vectors.
    """
    if len(vec1) != len(vec2) or all(v == 0.0 for v in vec1) or all(v == 0.0 for v in vec2):
        return 0.0
        
    try:
        import numpy as np
        v1 = np.array(vec1)
        v2 = np.array(vec2)
        dot_product = np.dot(v1, v2)
        norm_v1 = np.linalg.norm(v1)
        norm_v2 = np.linalg.norm(v2)
        return float(dot_product / (norm_v1 * norm_v2))
    except Exception:
        # Pure Python fallback
        dot_product = sum(a * b for a, b in zip(vec1, vec2))
        norm_v1 = math.sqrt(sum(a * a for a in vec1))
        norm_v2 = math.sqrt(sum(b * b for b in vec2))
        if norm_v1 == 0 or norm_v2 == 0:
            return 0.0
        return dot_product / (norm_v1 * norm_v2)

def _generate_fallback_embedding(text: str) -> List[float]:
    """
    Generates a deterministic 384-dimensional unit vector using string hashing.
    Used when torch/sentence-transformers are unavailable.
    """
    words = text.lower().split()
    vector = [0.0] * 384
    
    for word in words:
        # Simple polynomial hash to distribute words across 384 dimensions
        h = 0
        for char in word:
            h = (h * 31 + ord(char)) & 0xFFFFFFFF
        dim = h % 384
        # Add frequency weighting
        vector[dim] += 1.0
        
    # Add a global hash of the entire text to spread background signal
    h_full = hash(text) & 0xFFFFFFFF
    for i in range(10):
        dim = (h_full + i * 37) % 384
        vector[dim] += 0.5
        
    # L2 Normalization
    magnitude = math.sqrt(sum(v * v for v in vector))
    if magnitude > 0:
        vector = [v / magnitude for v in vector]
        
    return vector
