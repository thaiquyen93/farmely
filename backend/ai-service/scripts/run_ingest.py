import sys
import json
import numpy as np
from pathlib import Path

# Thêm thư mục ai-service vào sys.path để import src
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(BASE_DIR))

from src.config import settings
from src.ingestion.loader import load_markdown_documents
from src.ingestion.chunker import chunk_markdown_documents
from src.ingestion.embedder import embed_chunks

def run_pipeline():
    print("=" * 60)
    print("🌾 FARMELY AI SERVICE - OFFLINE INGESTION PIPELINE")
    print("=" * 60)

    # 1. Load tài liệu
    print(f"\n[BƯỚC 1] Đọc tài liệu từ: {settings.RAW_DATA_DIR}")
    docs = load_markdown_documents(settings.RAW_DATA_DIR)
    print(f" -> Đã tìm thấy {len(docs)} tài liệu Markdown:")
    for d in docs:
        print(f"    • {d['source']} ({len(d['content'])} ký tự)")

    if not docs:
        print("[ERROR] Không tìm thấy tài liệu nào trong thư mục data/raw/!")
        return

    # 2. Chunking
    print("\n[BƯỚC 2] Cắt nhỏ tài liệu (Markdown-aware chunking)...")
    chunks = chunk_markdown_documents(docs, max_chunk_words=400)
    print(f" -> Đã tạo ra tổng cộng {len(chunks)} chunks.")
    for i, c in enumerate(chunks[:3]):
        print(f"    Chunk #{c['chunk_id']} [{c['source']}] - {c['section_title']}")

    # 3. Embedding
    print("\n[BƯỚC 3] Sinh Vector Embeddings...")
    vectors = embed_chunks(chunks)
    print(f" -> Kích thước ma trận vector: {vectors.shape}")

    # 4. Lưu ra file
    print("\n[BƯỚC 4] Lưu dữ liệu vào thư mục data/processed/...")
    settings.PROCESSED_DATA_DIR.mkdir(parents=True, exist_ok=True)

    # Lưu vectors.npy
    np.save(settings.VECTORS_FILE, vectors)
    print(f" -> Đã lưu ma trận vector: {settings.VECTORS_FILE}")

    # Lưu chunks.json
    with open(settings.CHUNKS_FILE, "w", encoding="utf-8") as f:
        json.dump(chunks, f, ensure_ascii=False, indent=2)
    print(f" -> Đã lưu thông tin chunks: {settings.CHUNKS_FILE}")

    print("\n✅ HOÀN TẤT OFFLINE INGESTION THÀNH CÔNG!")
    print("=" * 60)

if __name__ == "__main__":
    run_pipeline()
