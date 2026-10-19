import numpy as np
from typing import List, Dict
from src.config import settings
from src.rag.vector_store import vector_store
from src.rag.similarity import compute_cosine_similarity
from src.ingestion.embedder import get_query_embedding

def retrieve_context(query: str, top_k: int = None, threshold: float = None) -> List[Dict[str, any]]:
    """
    Tìm kiếm các đoạn văn bản liên quan nhất cho câu hỏi của người dùng.
    
    Quy trình:
      1. Embed câu hỏi thành query vector.
      2. Tính Cosine Similarity với ma trận vector.
      3. Sắp xếp điểm số giảm dần (np.argsort(-scores)).
      4. Trích xuất Top-K kết quả vượt qua ngưỡng threshold.
    """
    if top_k is None:
        top_k = settings.TOP_K
    if threshold is None:
        threshold = settings.SIMILARITY_THRESHOLD

    if not vector_store.is_ready:
        success = vector_store.load()
        if not success:
            print("[WARN] VectorStore chưa sẵn sàng, trả về context rỗng.")
            return []

    # 1. Sinh vector nhúng cho câu hỏi
    query_vec = get_query_embedding(query)

    # 2. Tự tính Cosine Similarity trên RAM bằng NumPy
    scores = compute_cosine_similarity(query_vec, vector_store.vectors)

    # 3. Sắp xếp thứ tự ưu tiên giảm dần bằng argsort
    # Dấu '-' đảo ngược thứ tự để lấy điểm cao nhất lên đầu
    ranked_indices = np.argsort(-scores)

    results = []
    for idx in ranked_indices[:top_k]:
        score = float(scores[idx])
        if score >= threshold:
            chunk = vector_store.chunks[idx]
            results.append({
                "chunk_id": chunk["chunk_id"],
                "source": chunk["source"],
                "doc_title": chunk.get("doc_title", ""),
                "section_title": chunk.get("section_title", ""),
                "content": chunk["content"],
                "similarity_score": round(score, 4)
            })

    return results
