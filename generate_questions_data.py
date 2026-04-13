from __future__ import annotations

import json
import re
from pathlib import Path


MOCK_TEST_DIR = Path(__file__).resolve().parent
REPO_ROOT = MOCK_TEST_DIR.parent
QUESTIONS_PATH = MOCK_TEST_DIR / "questions.json"
CHEATSHEETS_DIR = REPO_ROOT / "cheatsheets"
QUESTIONS_JS_PATH = MOCK_TEST_DIR / "questions_data.js"
CHEATSHEETS_JS_PATH = MOCK_TEST_DIR / "cheatsheets_data.js"


def load_questions() -> list[dict]:
    questions = json.loads(QUESTIONS_PATH.read_text(encoding="utf-8"))
    if not isinstance(questions, list):
        raise ValueError("questions.json must contain a top-level list")
    return questions


def load_cheatsheets() -> list[dict]:
    cheatsheets: list[dict] = []
    for path in sorted(CHEATSHEETS_DIR.glob("*.md")):
        module_id = path.stem
        if module_id.startswith("04_"):
            continue
        markdown = path.read_text(encoding="utf-8")
        title = module_id.replace("_", " ").title()
        for line in markdown.splitlines():
            if line.startswith("# "):
                heading = re.sub(r"\s+—\s+EPA Cheatsheet\s*$", "", line[2:].strip())
                if heading:
                    title = heading
                break
        cheatsheets.append(
            {
                "module": module_id,
                "title": title,
                "markdown": markdown,
            }
        )
    return cheatsheets


def write_js(target: Path, variable_name: str, payload: list[dict]) -> None:
    body = json.dumps(payload, ensure_ascii=False, indent=2)
    target.write_text(f"window.{variable_name} = {body};\n", encoding="utf-8")


def main() -> None:
    questions = load_questions()
    cheatsheets = load_cheatsheets()

    write_js(QUESTIONS_JS_PATH, "QUESTION_BANK", questions)
    write_js(CHEATSHEETS_JS_PATH, "CHEATSHEET_BANK", cheatsheets)

    print(f"Wrote {QUESTIONS_JS_PATH.name} with {len(questions)} questions")
    print(f"Wrote {CHEATSHEETS_JS_PATH.name} with {len(cheatsheets)} cheatsheets")


if __name__ == "__main__":
    main()
