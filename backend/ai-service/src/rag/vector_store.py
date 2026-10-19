import json
import numpy as np
from pathlib import Path
from typing import List, Dict, Optional
from src.config import settings

class VectorStore:
    """
    Quản lý bộ nhớ Vector và văn bản trên RAM.
    Tự động load dữ liệu khi khởi chạy ứng dụng.
    """
    def __init__(self):
        self.vectors: Optional[np.ndarray] = None
        self.chunks: List[Dict[str, any]] = []
        self._is_loaded: bool = False

    def load(self, force_reload: bool = False) -> bool:
        if self._is_loaded and not force_reload:
            return True

        vectors_path = settings.VECTORS_FILE
        chunks_path = settings.CHUNKS_FILE

        if not vectors_path.exists() or not chunks_path.exists():
            print(f"[WARN] Chưa tìm thấy file dữ liệu vector đã xử lý: {vectors_path}")
            return False

        try:
            self.vectors = np.load(vectors_path)
            with open(chunks_path, "r", encoding="utf-8") as f:
                self.chunks = json.load(f)
            self._is_loaded = True
            print(f"[INFO] VectorStore đã tải {len(self.chunks)} chunks và ma trận vector {self.vectors.shape}")
            return True
        except Exception as e:
            print(f"[ERROR] Không thể tải VectorStore: {e}")
            return False

    @property
    def is_ready(self) -> bool:
        return self._is_loaded and self.vectors is not None and len(self.chunks) > 0

# Singleton instance dùng chung trong ứng dụng
vector_store = VectorStore()
