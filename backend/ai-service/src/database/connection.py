from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from src.config import settings

Base = declarative_base()

def get_db_engine():
    """
    Khởi tạo kết nối CSDL: Ưu tiên PostgreSQL từ hệ thống Farmely.
    Nếu PostgreSQL chưa khởi chạy và FALLBACK_SQLITE=True, tự động chuyển sang SQLite local.
    """
    engine = None
    try:
        engine = create_engine(settings.DATABASE_URL, pool_pre_ping=True, pool_size=5, max_overflow=10)
        # Test kết nối nhanh
        with engine.connect() as conn:
            print("[INFO] Đã kết nối thành công tới PostgreSQL (Farmely DB).")
        return engine
    except Exception as e:
        if settings.FALLBACK_SQLITE:
            sqlite_url = f"sqlite:///{settings.SQLITE_DB_FILE}"
            print(f"[WARN] Không thể kết nối PostgreSQL ({e}). Tự động chuyển sang SQLite: {sqlite_url}")
            engine = create_engine(sqlite_url, connect_args={"check_same_thread": False})
            return engine
        else:
            raise e

engine = get_db_engine()
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Tạo bảng nếu chưa tồn tại"""
    Base.metadata.create_all(bind=engine)
