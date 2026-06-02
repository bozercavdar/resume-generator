import json
import re
from pathlib import Path
from jsonschema import validate
from google import genai


def validate_resume(data: dict, schema_path: Path):
    schema = json.loads(schema_path.read_text(encoding="utf-8"))
    validate(instance=data, schema=schema)


def adjust_resume(
    resume_data: dict,
    job_description: str,
    api_key: str,
    role: str | None = None,
    strict: bool = False,
) -> dict:
    client = genai.Client(api_key=api_key)

    instructions = f"""
You are an expert resume editor and ATS optimization assistant.

RULES (VERY IMPORTANT):
- You MUST return ONLY valid JSON.
- Do NOT wrap the response in markdown or code fences.
- Preserve the exact JSON structure and keys.
- Do NOT invent experience, tools, companies, or education.
- Do NOT change dates, titles, or organizations.
- Do NOT invent new fields that is different the given JSON.
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
        model="gemini-2.5-flash",
        contents=instructions,
        config={"temperature": 0.2},
    )

    text = response.text.strip()
    text = re.sub(r"^```(?:json)?|```$", "", text).strip()

    try:
        return json.loads(text)
    except json.JSONDecodeError as e:
        raise ValueError(f"Gemini did not return valid JSON:\n{text}") from e


def generate_cover_letter_text(
    resume_data: dict,
    job_description: str,
    api_key: str,
    company: str | None = None,
    role: str | None = None,
) -> str:
    client = genai.Client(api_key=api_key)

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
        model="gemini-2.5-flash",
        contents=instructions,
        config={"temperature": 0.3},
    )

    return response.text.strip()
