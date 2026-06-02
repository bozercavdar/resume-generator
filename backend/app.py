import io
import json
import os
from pathlib import Path
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from ai_utils import adjust_resume, generate_cover_letter_text, validate_resume
from cv_utils import generate_cover_letter_docx, html_to_pdf, render_html

load_dotenv()

BASE_DIR = Path(__file__).resolve().parent

app = FastAPI(title="Resume Generator API")

_origins_env = os.environ.get(
    "ALLOWED_ORIGINS",
    "http://localhost:5173,http://localhost:3000",
)
_allowed_origins = [o.strip() for o in _origins_env.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------- API-key dependency ----------

def resolve_api_key(x_gemini_key: str | None = Header(default=None)) -> str:
    """Accept key from request header; fall back to env var for local dev."""
    key = x_gemini_key or os.environ.get("GEMINI_API_KEY")
    if not key:
        raise HTTPException(
            status_code=401,
            detail="No Gemini API key provided. Send it in the X-Gemini-Key request header.",
        )
    return key


# ---------- Request models ----------

class AdjustResumeRequest(BaseModel):
    resume_data: dict
    job_description: str
    role: Optional[str] = None
    strict: bool = False


class GeneratePDFRequest(BaseModel):
    resume_data: dict
    template_name: str = "ats_resume.html"


class CoverLetterRequest(BaseModel):
    resume_data: dict
    job_description: str
    company: Optional[str] = None
    role: Optional[str] = None


class CoverLetterDownloadRequest(BaseModel):
    text: str
    name: str
    email: Optional[str] = None


# ---------- Routes ----------

@app.get("/api/health")
def health():
    return {"status": "ok", "env_key_set": bool(os.environ.get("GEMINI_API_KEY"))}


@app.get("/api/schema")
def get_schema():
    return json.loads((BASE_DIR / "resume_schema.json").read_text(encoding="utf-8"))


@app.post("/api/resume/adjust")
def adjust_resume_endpoint(
    req: AdjustResumeRequest,
    api_key: str = Depends(resolve_api_key),
):
    try:
        adjusted = adjust_resume(
            req.resume_data,
            req.job_description,
            api_key=api_key,
            role=req.role,
            strict=req.strict,
        )
        validate_resume(adjusted, BASE_DIR / "resume_schema.json")
        return adjusted
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/resume/pdf")
def generate_pdf_endpoint(req: GeneratePDFRequest):
    try:
        html_content = render_html(req.resume_data, req.template_name)
        pdf_bytes = html_to_pdf(html_content)
        filename = f"{req.resume_data['name'].replace(' ', '_')}_Resume.pdf"
        return StreamingResponse(
            io.BytesIO(pdf_bytes),
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cover-letter")
def generate_cover_letter_endpoint(
    req: CoverLetterRequest,
    api_key: str = Depends(resolve_api_key),
):
    try:
        text = generate_cover_letter_text(
            req.resume_data,
            req.job_description,
            api_key=api_key,
            company=req.company,
            role=req.role,
        )
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/cover-letter/download")
def download_cover_letter_endpoint(req: CoverLetterDownloadRequest):
    try:
        docx_bytes = generate_cover_letter_docx(req.text, req.name, req.email)
        filename = f"{req.name.replace(' ', '_')}_Cover_Letter.docx"
        return StreamingResponse(
            io.BytesIO(docx_bytes),
            media_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
