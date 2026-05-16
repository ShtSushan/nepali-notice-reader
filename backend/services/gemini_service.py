# ─────────────────────────────────────────
#   OCR Service
#   Responsibility: Extract text from image or PDF
#   Uses: Tesseract (local, free, no quota)
#   Supports: Nepali + English
# ─────────────────────────────────────────

import pytesseract
from PIL import Image
from pdf2image import convert_from_bytes
import io

# ── Point to Tesseract executable (Windows path) ──
pytesseract.pytesseract.tesseract_cmd = r"C:\Program Files\Tesseract-OCR\tesseract.exe"

# ── Poppler path (Windows) — pdf2image needs this ──
# Download from: https://github.com/oschwartz10612/poppler-windows/releases
# Extract and point this to the bin/ folder inside
POPPLER_PATH =  r"C:\poppler\poppler-26.02.0\Library\bin"

# ── Tesseract config ──
TESSERACT_CONFIG = "--psm 6"
TESSERACT_LANG   = "nep+eng"


def _ocr_image(img: Image.Image) -> str:
    """
    Internal helper: runs Tesseract on a single PIL Image.
    Converts to RGB if needed.
    """
    if img.mode != "RGB":
        img = img.convert("RGB")

    return pytesseract.image_to_string(
        img,
        lang=TESSERACT_LANG,
        config=TESSERACT_CONFIG
    ).strip()


def extract_text_from_image(image_path: str) -> str:
    """
    Takes a local image file path.
    Extracts Nepali/English text using Tesseract OCR.
    """
    try:
        img = Image.open(image_path)
        extracted_text = _ocr_image(img)

        if not extracted_text:
            raise ValueError("Tesseract returned empty text — check image quality")

        return extracted_text

    except Exception as e:
        raise RuntimeError(f"OCR failed: {str(e)}")


def extract_text_from_bytes(image_bytes: bytes) -> str:
    """
    Takes raw image bytes (from FastAPI file upload).
    Extracts Nepali/English text using Tesseract OCR.
    """
    try:
        img = Image.open(io.BytesIO(image_bytes))
        extracted_text = _ocr_image(img)

        if not extracted_text:
            raise ValueError("Tesseract returned empty text — check image quality")

        return extracted_text

    except Exception as e:
        raise RuntimeError(f"OCR failed: {str(e)}")


def extract_text_from_pdf(pdf_bytes: bytes) -> str:
    """
    Takes raw PDF bytes (from FastAPI file upload).
    Converts each page to an image, runs Tesseract on each,
    then joins all pages' text into one string.
    """
    try:
        pages = convert_from_bytes(
            pdf_bytes,
            dpi=300,                  # high DPI = better OCR accuracy
            poppler_path=POPPLER_PATH
        )

        if not pages:
            raise ValueError("PDF has no pages or could not be converted")

        page_texts = []
        for i, page_img in enumerate(pages):
            text = _ocr_image(page_img)
            if text:
                page_texts.append(text)

        full_text = "\n\n".join(page_texts).strip()

        if not full_text:
            raise ValueError("Tesseract returned empty text for all pages — check PDF quality")

        return full_text

    except Exception as e:
        raise RuntimeError(f"PDF OCR failed: {str(e)}")