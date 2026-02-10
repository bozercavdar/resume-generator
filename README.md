# AI‑Assisted ATS Resume Generator

This project is a **Python‑based pipeline** that takes a structured resume (JSON), optionally adapts it to a **job description using the Gemini API**, and generates an **ATS‑friendly PDF resume** using HTML templates and WeasyPrint.

It is designed to be:

* ATS‑safe (single column, text‑based PDF)
* Reproducible (JSON → HTML → PDF)
* Auditable (diff of AI changes)
* Extensible (swap AI providers, templates, roles)

---

## Project Workflow (High Level)

1. You write your resume once in `resume_data.json`
2. You paste a job description into `job_description.txt`
3. The AI adjusts your resume **without changing structure or inventing experience**
4. The adjusted resume is validated against a JSON schema
5. Differences are saved for review
6. The resume is rendered to HTML and exported as a PDF

---

## Project Structure

```
.
├── main.py                    # Orchestrates the full workflow
├── cv_utils.py                # Resume loading, HTML rendering, PDF generation
├── ai_utils.py                # Gemini integration, validation, diff logic
├── resume_data.json           # Your base resume (edit this)
├── resume_data_adjusted.json  # AI‑adjusted resume (auto‑generated)
├── resume_schema.json         # JSON schema (structure guard)
├── resume_diff.txt            # Diff between original and adjusted resume
├── job_description.txt        # Target job description
├── templates/
│   └── ats_resume.html        # ATS‑friendly HTML template
├── requirements.txt
└── CV.pdf                     # Final generated resume
```

---

## Python Version

* **Python 3.10+** recommended

---

## Installation

### 1. Create and activate a virtual environment

```bash
python -m venv .venv
source .venv/bin/activate   # Linux / macOS
# .venv\Scripts\activate    # Windows
```

### 2. Install Python dependencies

```bash
pip install -r requirements.txt
```

---

## System Dependencies (IMPORTANT – WeasyPrint)

WeasyPrint is a **native HTML → PDF engine** and requires system libraries. Installation differs by operating system.

---

### Linux (Ubuntu / Debian)

```bash
sudo apt update
sudo apt install \
  libcairo2 \
  libpango-1.0-0 \
  libpangocairo-1.0-0 \
  libgdk-pixbuf2.0-0 \
  libffi-dev \
  shared-mime-info
```

---

### Windows (Recommended Setup)

On Windows, WeasyPrint depends on **GTK, Pango, and Cairo**. The easiest and most reliable approach is to install the official GTK runtime.

#### 1. Install GTK Runtime

Download and install **GTK 3 Runtime for Windows**:

* [https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer](https://github.com/tschoonj/GTK-for-Windows-Runtime-Environment-Installer)

Choose:

* **GTK 3**
* **64-bit** version

During installation, allow the installer to:

* Add GTK to your **PATH**

#### 2. Verify GTK installation

Open **PowerShell** and run:

```powershell
gtk-launch --version
```

If the command is recognized, GTK is correctly installed.

#### 3. Install WeasyPrint (Python)

```powershell
pip install weasyprint
```

#### 4. Verify WeasyPrint

```powershell
python -c "from weasyprint import HTML; HTML(string='<h1>Test</h1>').write_pdf('test.pdf')"
```

If `test.pdf` is created successfully, WeasyPrint is working.

---

### Common Windows Issues

* ❌ `OSError: cannot load library 'pango-1.0-0'`

  * GTK runtime not installed or not on PATH

* ❌ Python 32-bit installed

  * GTK requires **64-bit Python**

* ❌ Works in terminal but not IDE

  * Restart IDE after GTK install

---

### macOS (Optional)

```bash
brew install pango cairo gdk-pixbuf libffi
pip install weasyprint
```

---

### Verify WeasyPrint (All OS)

```bash
python -c "from weasyprint import HTML; HTML(string='<h1>Test</h1>').write_pdf('test.pdf')"
```

If `test.pdf` is created, WeasyPrint is correctly installed.

---

## Gemini API Setup (Free Tier)

This project uses **Google Gemini** to adjust resume content.

### 1. Get an API key

* Go to **Google AI Studio**
* Create an API key

### 2. Set environment variable

#### Linux / macOS

```bash
export GEMINI_API_KEY="YOUR_API_KEY"
```

#### Windows (PowerShell)

```powershell
setx GEMINI_API_KEY "YOUR_API_KEY"
```

Restart your terminal after setting it.

---

## Resume Data Format

Your resume lives in `resume_data.json` and must follow the provided schema.

Key design rules:

* Arrays keep order (important for experience priority)
* Empty or missing optional fields auto‑hide in the template
* No formatting, icons, or markup in content

An anonymized template is provided for reference.

---

## Running the Project

From the project root:

```bash
python main.py
```

This will:

1. Load `resume_data.json`
2. Read `job_description.txt`
3. Adjust the resume using Gemini
4. Validate output against `resume_schema.json`
5. Save:

   * `resume_data_adjusted.json`
   * `resume_diff.txt`
6. Render and generate `CV.pdf`

---

## Output Files Explained

| File                        | Purpose                             |
| --------------------------- | ----------------------------------- |
| `resume_data_adjusted.json` | AI‑optimized resume data            |
| `resume_diff.txt`           | Exact changes made by the AI        |
| `CV.pdf`                    | Final ATS‑friendly resume           |
| `failed_gemini_text.txt`    | Raw AI output if JSON parsing fails |

---

## AI Safety & Guarantees

The AI is **strictly constrained**:

* Cannot invent experience
* Cannot change dates, companies, or degrees
* Must preserve JSON structure
* Must return valid JSON only

If validation fails, the process stops.

---

## Customization

### Use strict mode (minimal edits)

In `main.py`, change:

```python
adjusted_resume = adjust_resume(original_resume_data, job_description, strict=True)
```

### Target a specific role

```python
adjusted_resume = adjust_resume(
    original_resume_data,
    job_description,
    role="Data Scientist"
)
```

### Skip AI entirely (manual resume)

Comment out the AI call and render directly from `resume_data.json`.

---

## Troubleshooting

### Gemini returns invalid JSON

* Check `failed_gemini_text.txt`
* Reduce temperature
* Enable strict mode

### WeasyPrint fails

* Missing system libraries (see above)
* Font not installed (use Liberation Sans or embed fonts)

### Environment variable not found

```bash
echo $GEMINI_API_KEY
```

---

## Why This Architecture Works

* Structured data → predictable output
* AI only *transforms*, never creates facts
* ATS systems can parse the PDF reliably
* Easy to extend to other AI providers

---

## License / Usage

This project is intended for **personal and educational use**.
Adapt freely for your own resume workflows.
