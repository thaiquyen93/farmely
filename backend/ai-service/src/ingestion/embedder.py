import numpy as np
from typing import List
import hashlib
from src.config import settings

def _mock_fallback_embed(text: str, dim: int = 768) -> np.ndarray:
    """
    Tạo vector giả lập chuẩn hóa (Unit Vector) dựa trên thuật toán Hash
    khi chưa có API Key hoặc mất mạng, giúp hệ thống không bao giờ bị dừng đột ngột.
    """
    vec = np.zeros(dim, dtype=np.float32)
    words = text.lower().split()
    if not words:
        return vec
    for word in words:
        # Băm từng từ thành index trong không gian vector dim
        h = int(hashlib.md5(word.encode('utf-8')).hexdigest(), 16)
        idx = h % dim
        vec[idx] += 1.0
    norm = np.linalg.norm(vec)
    if norm > 0:
        vec /= norm
    return vec

def get_embedding(text: str) -> np.ndarray:
    """
    Sinh vector nhúng cho 1 đoạn văn bản sử dụng Google Gemini Embedding API qua HTTP REST.
    """
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        return _mock_fallback_embed(text)

    try:
        import requests
        model_name = settings.EMBEDDING_MODEL.replace("models/", "")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:embedContent?key={settings.GEMINI_API_KEY}"
        payload = {"content": {"parts": [{"text": text}]}}
        res = requests.post(url, json=payload, timeout=12)
        if res.status_code == 200:
            data = res.json()
            values = data.get("embedding", {}).get("values", [])
            vec = np.array(values, dtype=np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec /= norm
            return vec
        else:
            print(f"[WARN] Gemini Embed API mã {res.status_code}: {res.text[:100]}")
            return _mock_fallback_embed(text)
    except Exception as e:
        print(f"[WARN] Gọi Gemini Embedding lỗi ({e}), chuyển sang Mock Fallback Vector.")
        return _mock_fallback_embed(text)

def get_query_embedding(query: str) -> np.ndarray:
    """
    Sinh vector nhúng cho câu hỏi của người dùng sử dụng Google Gemini Embedding API qua HTTP REST.
    """
    if not settings.GEMINI_API_KEY or settings.GEMINI_API_KEY == "your_gemini_api_key_here":
        return _mock_fallback_embed(query)

    try:
        import requests
        model_name = settings.EMBEDDING_MODEL.replace("models/", "")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:embedContent?key={settings.GEMINI_API_KEY}"
        payload = {"content": {"parts": [{"text": query}]}}
        res = requests.post(url, json=payload, timeout=10)
        if res.status_code == 200:
            data = res.json()
            values = data.get("embedding", {}).get("values", [])
            vec = np.array(values, dtype=np.float32)
            norm = np.linalg.norm(vec)
            if norm > 0:
                vec /= norm
            return vec
        else:
            print(f"[WARN] Gemini Query Embed API mã {res.status_code}: {res.text[:100]}")
            return _mock_fallback_embed(query)
    except Exception as e:
        print(f"[WARN] Gọi Gemini Query Embedding lỗi ({e}), chuyển sang Mock Fallback.")
        return _mock_fallback_embed(query)

def embed_chunks(chunks: List[dict]) -> np.ndarray:
    """
    Sinh ma trận embedding (N, D) cho toàn bộ danh sách chunks.
    """
    vectors = []
    print(f"[INFO] Bắt đầu sinh embeddings cho {len(chunks)} chunks...")
    for i, c in enumerate(chunks):
        v = get_embedding(c["content"])
        vectors.append(v)
        if (i + 1) % 5 == 0 or (i + 1) == len(chunks):
            print(f" -> Đã xử lý {i + 1}/{len(chunks)} chunks")
    return np.vstack(vectors).astype(np.float32)
