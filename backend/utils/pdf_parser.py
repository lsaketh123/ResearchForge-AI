import io
import logging
from typing import List
from pypdf import PdfReader

logger = logging.getLogger("researchhub.pdf_parser")

def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Extracts plain text from raw PDF bytes.
    """
    try:
        pdf_file = io.BytesIO(pdf_bytes)
        reader = PdfReader(pdf_file)
        full_text = []
        
        for i, page in enumerate(reader.pages):
            text = page.extract_text()
            if text:
                full_text.append(text)
                
        extracted = "\n".join(full_text)
        logger.info(f"Extracted {len(extracted)} characters from PDF.")
        return extracted
    except Exception as e:
        logger.error(f"Error parsing PDF file: {e}")
        raise ValueError(f"Failed to parse PDF: {str(e)}")

def chunk_text(text: str, chunk_size: int = 1000, overlap: int = 200) -> List[str]:
    """
    Chunks large text into smaller overlapping segments for dense vector indexing (RAG).
    """
    if not text:
        return []
        
    chunks = []
    start = 0
    text_len = len(text)
    
    while start < text_len:
        end = min(start + chunk_size, text_len)
        chunk = text[start:end].strip()
        if chunk:
            chunks.append(chunk)
        # Advance by chunk_size minus overlap
        start += (chunk_size - overlap)
        
        # Guard to prevent infinite loop if overlap >= chunk_size
        if chunk_size <= overlap:
            break
            
    return chunks
