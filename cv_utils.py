from pathlib import Path
import json

from jinja2 import Environment, FileSystemLoader
from weasyprint import HTML


BASE_DIR = Path(__file__).resolve().parent


def load_resume_data(path: Path) -> dict:
    with path.open(encoding="utf-8") as f:
        return json.load(f)


def render_html(resume_data: dict, template_name: str) -> str:
    env = Environment(
        loader=FileSystemLoader(BASE_DIR / "templates"),
        autoescape=True,
    )
    template = env.get_template(template_name)
    return template.render(resume=resume_data)


def html_to_pdf(html_content: str, output_path: Path) -> None:
    HTML(string=html_content).write_pdf(str(output_path))
