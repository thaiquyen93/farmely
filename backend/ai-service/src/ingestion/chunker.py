import re
from typing import List, Dict

def chunk_markdown_documents(documents: List[Dict[str, str]], max_chunk_words: int = 500) -> List[Dict[str, any]]:
    """
    Cắt nhỏ tài liệu Markdown theo cấu trúc tiêu đề (#, ##) để giữ nguyên vẹn
    ý nghĩa của từng quy trình kỹ thuật, không làm gãy công thức hay bảng biểu.
    """
    chunks = []
    chunk_id = 1

    for doc in documents:
        content = doc["content"]
        source = doc["source"]
        
        # Lấy tiêu đề chính của tài liệu (# Tiêu đề)
        doc_title_match = re.search(r"^#\s+(.+)$", content, re.MULTILINE)
        doc_title = doc_title_match.group(1).strip() if doc_title_match else source

        # Tách tài liệu theo các section ## hoặc ###
        sections = re.split(r"(?m)^(?=##\s+)", content)

        for sec in sections:
            sec_text = sec.strip()
            if not sec_text:
                continue

            # Lấy tiêu đề section nếu có
            sec_title_match = re.search(r"^##\s+(.+)$", sec_text, re.MULTILINE)
            sec_title = sec_title_match.group(1).strip() if sec_title_match else doc_title

            words = sec_text.split()
            # Nếu section quá dài (> max_chunk_words), chia tiếp theo đoạn văn (\n\n)
            if len(words) > max_chunk_words:
                paragraphs = sec_text.split("\n\n")
                current_chunk = []
                current_len = 0

                for para in paragraphs:
                    p_words = para.split()
                    if current_len + len(p_words) > max_chunk_words and current_chunk:
                        chunk_content = "\n\n".join(current_chunk).strip()
                        chunks.append({
                            "chunk_id": chunk_id,
                            "source": source,
                            "doc_title": doc_title,
                            "section_title": sec_title,
                            "content": f"### {doc_title} - {sec_title}\n{chunk_content}"
                        })
                        chunk_id += 1
                        current_chunk = [para]
                        current_len = len(p_words)
                    else:
                        current_chunk.append(para)
                        current_len += len(p_words)

                if current_chunk:
                    chunk_content = "\n\n".join(current_chunk).strip()
                    chunks.append({
                        "chunk_id": chunk_id,
                        "source": source,
                        "doc_title": doc_title,
                        "section_title": sec_title,
                        "content": f"### {doc_title} - {sec_title}\n{chunk_content}"
                    })
                    chunk_id += 1
            else:
                chunks.append({
                    "chunk_id": chunk_id,
                    "source": source,
                    "doc_title": doc_title,
                    "section_title": sec_title,
                    "content": sec_text
                })
                chunk_id += 1

    return chunks
