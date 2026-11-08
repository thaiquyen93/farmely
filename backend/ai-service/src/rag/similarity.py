import numpy as np

def compute_cosine_similarity(query_vector: np.ndarray, doc_matrix: np.ndarray) -> np.ndarray:
    """
    Tự cài đặt thuật toán Cosine Similarity bằng NumPy từ đầu (From Scratch).
    
    Công thức:
        cosine_similarity(A, B) = (A . B) / (||A|| * ||B||)
        
    Args:
        query_vector: Vector 1D đại diện cho câu hỏi (D,)
        doc_matrix: Ma trận 2D đại diện cho tập văn bản (N, D)
        
    Returns:
        Mảng 1D (N,) chứa điểm tương đồng trong khoảng [-1.0, 1.0]
    """
    if doc_matrix.ndim != 2:
        raise ValueError(f"doc_matrix phải là ma trận 2 chiều, nhận được ndim={doc_matrix.ndim}")
    
    # 1. Tính tích vô hướng (Dot product) giữa query và từng văn bản
    # Shape: (N,)
    dot_products = np.dot(doc_matrix, query_vector)

    # 2. Tính độ dài Euclid (L2 norm) của từng vector
    # Shape: (N,)
    doc_norms = np.linalg.norm(doc_matrix, axis=1)
    
    # Shape: scalar
    query_norm = np.linalg.norm(query_vector)

    # 3. Tránh lỗi chia cho 0 (ZeroDivisionError) bằng epsilon rất nhỏ
    denominator = doc_norms * query_norm
    denominator = np.where(denominator == 0, 1e-10, denominator)

    # 4. Tính toán điểm số tương đồng cosine
    scores = dot_products / denominator

    # Đảm bảo điểm số không vượt quá biên [-1.0, 1.0] do sai số float
    return np.clip(scores, -1.0, 1.0)
