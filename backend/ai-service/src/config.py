import os
from pathlib import Path
from dotenv import load_dotenv

# Load .env từ thư mục gốc của ai-service
BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

class Settings:
    PORT: int = int(os.getenv("PORT", 8089))
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    LLM_MODEL: str = os.getenv("LLM_MODEL", "gemini-1.5-flash")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "models/text-embedding-004")
    
    DATABASE_URL: str = os.getenv("DATABASE_URL", "postgresql://postgres:password@localhost:5432/smartagrirent_ai")
    FALLBACK_SQLITE: bool = os.getenv("FALLBACK_SQLITE", "True").lower() in ("true", "1", "yes")
    
    TOP_K: int = int(os.getenv("TOP_K", 3))
    SIMILARITY_THRESHOLD: float = float(os.getenv("SIMILARITY_THRESHOLD", 0.10))

    # Đường dẫn thư mục dữ liệu
    DATA_DIR: Path = BASE_DIR / "data"
    RAW_DATA_DIR: Path = DATA_DIR / "raw"
    PROCESSED_DATA_DIR: Path = DATA_DIR / "processed"
    VECTORS_FILE: Path = PROCESSED_DATA_DIR / "vectors.npy"
    CHUNKS_FILE: Path = PROCESSED_DATA_DIR / "chunks.json"
    SQLITE_DB_FILE: Path = DATA_DIR / "chat.db"

settings = Settings()
