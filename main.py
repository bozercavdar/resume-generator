from cv_utils import *
from ai_utils import *

BASE_DIR = Path(__file__).resolve().parent

def main():
    data_path = BASE_DIR / "resume_data.json"
    job_desc_path = BASE_DIR / "job_description.txt"
    adjusted_data_output_path = BASE_DIR / "resume_data_adjusted.json"
    resume_diff_output_path = BASE_DIR / "resume_diff.txt"
    template_name = "ats_resume.html"
    cv_output_path = BASE_DIR / "CV.pdf"
    cover_letter_output_path = BASE_DIR / "Cover_Letter.docx"

    # Load existing resume data
    original_resume_data = load_resume_data(data_path)
    # Read job description
    job_description = job_desc_path.read_text(encoding="utf-8")
    # Adjust resume for given job description and title (optional)
    # adjusted_resume = adjust_resume(resume_data, job_description, role="Data Scientist")
    adjusted_resume = adjust_resume(original_resume_data, job_description)
    # Validate output. if not valid, fails 
    validate_resume(adjusted_resume, BASE_DIR / "resume_schema.json")
    # Save adjusted resume data.
    save_json(adjusted_resume, adjusted_data_output_path)
    print(f"Adjusted resume data at: {adjusted_data_output_path}")
    # Save differences made in the adjusted resume comparing to the original resume.
    save_diff(original_resume_data, adjusted_resume, resume_diff_output_path)
    print(f"Resume differences at: {resume_diff_output_path}")
    # Render an html content with adjusted resume.
    html_content = render_html(adjusted_resume, template_name)
    # Convert html content to pdf
    html_to_pdf(html_content, cv_output_path)
    print(f"Generated PDF at: {cv_output_path}")

    # Generate cover letter
    cover_letter_text = generate_cover_letter_text(
        adjusted_resume,
        job_description
    )
    # Save cover letter as word file
    save_cover_letter_docx(
        cover_letter_text,
        cover_letter_output_path,
        name=adjusted_resume["name"],
        email=adjusted_resume.get("email")
    )

    print(f"Generated cover letter at: {cover_letter_output_path}")

if __name__ == "__main__":
    main()
