# Mock Knowledge Test App

Static browser app for the NTU Data Scientist Level 6 EPA revision bank.

## Files

- `index.html`: app shell
- `styles.css`: static styling
- `app.js`: quiz, results, persistence, and cheatsheet logic
- `questions.json`: canonical question bank
- `questions_data.js`: browser runtime copy of the question bank
- `cheatsheets_data.js`: browser runtime copy of the cheatsheets
- `generate_questions_data.py`: regenerates the browser data files

## Regenerate Browser Data

Whenever `questions.json` or anything under `../cheatsheets/` changes, run:

```powershell
python mock_test/generate_questions_data.py
```

This updates:

- `mock_test/questions_data.js`
- `mock_test/cheatsheets_data.js`

## Run

Open `mock_test/index.html` directly in a browser, or host the `mock_test/` directory on GitHub Pages.

## Behaviour Notes

- Timed papers are 30 questions in 60 minutes
- One question from each in-scope module is guaranteed before the rest of the paper is filled
- Questions are unique within a paper
- Option order is shuffled per session
- Session recovery uses `localStorage` with an absolute end timestamp
- Cheatsheets are separate from the live test flow
