from pathlib import Path
from typing import List, Dict

def _read_docx(file_path: Path) -> str:
    try:
        import docx
        doc = docx.Document(file_path)
        lines = []
        for element in doc.element.body:
            if element.tag.endswith('p'):
                p = docx.text.paragraph.Paragraph(element, doc)
                text = p.text.strip()
                if text:
                    lines.append(text)
            elif element.tag.endswith('tbl'):
                table = docx.table.Table(element, doc)
                for row in table.rows:
                    cells = [c.text.replace('\n', ' ').strip() for c in row.cells]
                    lines.append(" | ".join(cells))
        return "\n\n".join(lines)
    except Exception as e:
        print(f"[WARN] Không thể đọc docx {file_path.name}: {e}")
        return ""

def load_markdown_documents(raw_dir: Path) -> List[Dict[str, str]]:
    """
    Đọc tất cả các file .md và .docx trong thư mục data/raw/
    Ưu tiên file .md nếu đã có bản convert tương ứng.
    """
    documents = []
    if not raw_dir.exists():
        raw_dir.mkdir(parents=True, exist_ok=True)
        return documents

    # Đọc file .md
    loaded_stems = set()
    for file_path in raw_dir.glob("*.md"):
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                content = f.read().strip()
                if content:
                    documents.append({
                        "source": file_path.name,
                        "file_path": str(file_path),
                        "content": content
                    })
                    loaded_stems.add(file_path.stem.lower())
        except Exception as e:
            print(f"[ERROR] Không thể đọc file {file_path.name}: {e}")

    # Đọc file .docx nếu chưa có file .md cùng tên
    for file_path in raw_dir.glob("*.docx"):
        if file_path.stem.lower() in loaded_stems:
            continue
        content = _read_docx(file_path)
        if content:
            documents.append({
                "source": file_path.name,
                "file_path": str(file_path),
                "content": content
            })

    return documents
