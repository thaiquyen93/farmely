import uvicorn
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from src.config import settings
from src.database.connection import init_db
from src.rag.vector_store import vector_store
from src.api.chat_router import router as chat_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Khởi động: Tạo bảng DB và tải Vector Store
    print("[STARTUP] Khởi tạo cơ sở dữ liệu...")
    try:
        init_db()
    except Exception as e:
        print(f"[WARN] Lỗi khởi tạo DB: {e}")

    print("[STARTUP] Tải Vector Store vào RAM...")
    loaded = vector_store.load()
    if not loaded:
        print("[INFO] Chưa có vector sẵn, tiến hành chạy Ingestion tự động...")
        try:
            from scripts.run_ingest import run_pipeline
            run_pipeline()
            vector_store.load()
        except Exception as e:
            print(f"[WARN] Ingestion tự động thất bại: {e}")

    yield
    print("[SHUTDOWN] Dừng dịch vụ Farmely AI Service.")

app = FastAPI(
    title="Farmely AI Chatbot Service",
    description="Microservice tư vấn nông nghiệp thông minh Bác Ba Nông Dân qua RAG From-Scratch",
    version="1.0.0",
    lifespan=lifespan
)

# Cấu hình CORS để Frontend React và Gateway gọi trực tiếp
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Gắn router
app.include_router(chat_router)

@app.get("/")
def root():
    return {
        "service": "Farmely AI Service",
        "version": "1.0.0",
        "docs": "/docs",
        "health": "/api/ai/health"
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=settings.PORT, reload=True)
