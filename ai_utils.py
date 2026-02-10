import json
import os
from pathlib import Path
from jsonschema import validate
import difflib
from google import genai
import re
from docx import Document
from docx.shared import Pt


BASE_DIR = Path(__file__).resolve().parent

def validate_resume(data: dict, schema_path: Path):
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    validate(instance=data, schema=schema)

def save_diff(original: dict, modified: dict, output_path: Path):
    original_text = json.dumps(original, indent=2, ensure_ascii=False).splitlines()
    modified_text = json.dumps(modified, indent=2, ensure_ascii=False).splitlines()

    diff = difflib.unified_diff(
        original_text,
        modified_text,
        fromfile="original",
        tofile="adjusted",
        lineterm=""
    )

    output_path.write_text("\n".join(diff), encoding="utf-8")

def save_txt(output_path: Path, text: str):
    output_path.write_text(text, encoding="utf-8")

def save_json(data: dict, path: Path) -> None:
    with path.open("w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def adjust_resume(
    resume_data: dict,
    job_description: str,
    role: str | None = None,
    strict: bool = False
) -> dict:
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    instructions = f"""
You are an expert resume editor and ATS optimization assistant.

RULES (VERY IMPORTANT):
- You MUST return ONLY valid JSON.
- Do NOT wrap the response in markdown or code fences.
- Preserve the exact JSON structure and keys.
- Do NOT invent experience, tools, companies, or education.
- Do NOT change dates, titles, or organizations.
- You MAY rewrite and reorder bullet points.
- You MAY emphasize skills relevant to the job description.
- You MAY rewrite the summary according to the job description.
{"- STRICT MODE: Make minimal wording changes only. Do not reorder bullets unless clearly beneficial." if strict else ""}
{"- Target role: " + role if role else ""}

JOB DESCRIPTION:
{job_description}

CURRENT RESUME JSON:
{json.dumps(resume_data, indent=2, ensure_ascii=False)}

Return the adjusted resume JSON only.
"""

    response = client.models.generate_content(
        model='gemini-2.5-flash',
        contents=instructions,
        config={
            "temperature": 0.2
        }
    )

    text = response.text.strip()

    # --- Gemini often wraps JSON in ``` ---
    text = re.sub(r"^```(?:json)?|```$", "", text).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        failed_text_path = BASE_DIR / "failed_gemini_text.txt"
        save_txt(failed_text_path, text)
        raise ValueError(f"Gemini did not return valid JSON:\n{text}") from e

def generate_cover_letter_text(
    resume_data: dict,
    job_description: str,
    company: str | None = None,
    role: str | None = None
) -> str:
    client = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

    instructions = f"""
You are an expert career writer.

TASK:
Write a professional cover letter based ONLY on the resume data provided.

RULES (STRICT):
- Do NOT invent experience, tools, or achievements.
- Use ONLY information from the resume.
- Do NOT mention unrelated experience.
- Keep the tone professional and concise.
- Avoid clichés and buzzwords.
- Length: 3–4 paragraphs total.

STRUCTURE:
1. Short introduction (interest in role and company)
2. One paragraph connecting resume experience to job requirements
3. Optional second experience paragraph if relevant
4. Polite closing paragraph

JOB DESCRIPTION:
{job_description}

RESUME DATA:
{json.dumps(resume_data, indent=2, ensure_ascii=False)}

{"Company: " + company if company else ""}
{"Role: " + role if role else ""}

Return ONLY the cover letter text.
"""

    response = client.models.generate_content(
        model="models/gemini-2.5-flash",
        contents=instructions,
        config={"temperature": 0.3}
    )

    return response.text.strip()

