from cv_utils import *
from ai_utils import *

BASE_DIR = Path(__file__).resolve().parent

def generate_resume(original_resume_data, job_description):
    adjusted_data_output_path = BASE_DIR / "resume_data_adjusted.json"
    resume_diff_output_path = BASE_DIR / "resume_diff.txt"

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

def generate_cover_letter(resume_json, job_description):
    cover_letter_output_path = BASE_DIR / "Burhan_Ozer_Cavdar_Cover_Letter.docx"
    # Generate cover letter
    cover_letter_text = generate_cover_letter_text(resume_json, job_description)
    # Save cover letter as word file
    save_cover_letter_docx(cover_letter_text, cover_letter_output_path, name=resume_json["name"], email=resume_json.get("email"))
    print(f"Generated cover letter at: {cover_letter_output_path}")

def render_resume_pdf(resume_json):
    template_name = "ats_resume.html"
    cv_output_path = BASE_DIR / "Burhan_Ozer_Cavdar_CV.pdf"

    # Render an html content with adjusted resume.
    html_content = render_html(resume_json, template_name)
    # Convert html content to pdf
    html_to_pdf(html_content, cv_output_path)
    print(f"Generated PDF at: {cv_output_path}")

def main():
    data_path = BASE_DIR / "resume_data.json"
    job_desc_path = BASE_DIR / "job_description.txt"
    adjusted_data_output_path = BASE_DIR / "resume_data_adjusted.json"

    # Load existing resume data
    original_resume_data = load_resume_data(data_path)
    # Read job description
    job_description = job_desc_path.read_text(encoding="utf-8")
    
    # Adjust resume according to given job description
    generate_resume(original_resume_data, job_description)
    adjusted_resume = load_resume_data(adjusted_data_output_path)

    # Create a pdf
    render_resume_pdf(adjusted_resume)

    # Generate a cover letter
    generate_cover_letter(adjusted_resume, job_description)


if __name__ == "__main__":
    main()
