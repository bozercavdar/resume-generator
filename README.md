# Resume Generator

An AI-powered web app that tailors your resume to any job description and exports an ATS-friendly PDF — all in your browser.

## 🌐 Live App

**[https://resume-generator-tawny-five.vercel.app/](https://resume-generator-tawny-five.vercel.app/)**

> ⏳ **The app runs on a free hosting plan.** The backend server goes to sleep after periods of inactivity. If the app feels unresponsive when you first open it, **please wait up to 1 minute** for the server to wake up, then try again. Everything will work normally once it's running.

---

## What It Does

- **Build your resume** using a structured form (or import an existing JSON file)
- **Tailor it with AI** — paste a job description and Google Gemini rewrites your bullet points and summary to match, without inventing anything
- **Preview as a real A4 page** — see exactly how the PDF will look, with a page-overflow warning if your content is too long
- **Edit manually** — adjust any section after the AI pass
- **Download a PDF** ready for ATS systems
- **Generate a cover letter** based on your resume and the job description
- **Export your data as JSON** so you can reload it next time without re-entering everything

---

## How to Use

### Step 1 — Build Your Resume

Fill in your personal details, work experience, education, skills, and links.

- Use **Import from JSON** at the top to load a previously exported file
- Use **⬇ Export JSON** at the bottom to save your data for future sessions

### Step 2 — Tailor with AI *(optional)*

1. Enter your **Gemini API key** (free — get one at [Google AI Studio](https://aistudio.google.com/app/apikey))
2. Paste the **job description**
3. Optionally name the target role
4. Click **✨ Tailor Resume**

The AI rewrites your bullet points and summary to match the job — it cannot change your dates, companies, education, or invent experience.

> If you just need a PDF without AI tailoring, click **Skip to Preview** instead.

### Step 3 — Preview & Export

- The preview shows your resume as an **A4 page** — a dashed line marks where page 1 ends
- A warning badge appears if your content overflows to a second page
- Click **✏️ Edit Resume** to adjust anything manually
- Click **⬇ Download PDF** to get your resume
- Click **📝 Cover Letter** to generate and download a `.docx` cover letter (requires a job description from Step 2)

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React, Vite, Tailwind CSS |
| Backend | FastAPI (Python) |
| AI | Google Gemini 2.5 Flash |
| PDF generation | WeasyPrint |
| Cover letter | python-docx |
| Hosting | Vercel (frontend) + Render (backend) |

---

## Running Locally

### Prerequisites

- Python 3.12+
- Node.js 20+
- WeasyPrint system libraries (see below)

### Backend

```bash
# Install WeasyPrint system dependencies (Ubuntu/Debian)
sudo apt install libcairo2 libpango-1.0-0 libpangocairo-1.0-0 \
  libgdk-pixbuf-2.0-0 libffi-dev shared-mime-info fonts-liberation

# Set up Python environment
python -m venv .venv
source .venv/bin/activate

cd backend
pip install -r requirements.txt

# Optional: set a default API key so you don't need to enter it in the UI
cp ../.env.example ../.env
# Edit .env and add your GEMINI_API_KEY

uvicorn app:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### WeasyPrint on macOS

```bash
brew install pango cairo gdk-pixbuf libffi
```

### WeasyPrint on Windows

Install the [GTK 3 runtime for Windows](https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer) (64-bit), making sure to add it to your PATH. Then `pip install weasyprint`.

---

## Project Structure

```
resume-generator/
  backend/
    app.py              # FastAPI routes
    ai_utils.py         # Gemini API calls (resume tailoring, cover letter)
    cv_utils.py         # PDF and .docx generation
    resume_schema.json  # JSON schema — validates AI output
    templates/
      ats_resume.html   # ATS-friendly HTML template for PDF
    requirements.txt
    Dockerfile          # For Render deployment
  frontend/
    src/
      App.jsx           # Step orchestration
      api.js            # Backend fetch wrappers
      components/
        StepBar.jsx
        ResumeForm.jsx
        JobStep.jsx
        PreviewStep.jsx
        ResumePreview.jsx
    vite.config.js
  .env.example
```

---

## AI Safety

The AI is explicitly constrained — it **cannot**:
- Invent experience, tools, or companies
- Change dates, job titles, or education
- Add fields that don't exist in your original data

It **can** only rewrite and reorder bullet points, emphasize relevant skills, and rewrite the summary.

---

## License

Personal and educational use. Adapt freely for your own resume workflows.
