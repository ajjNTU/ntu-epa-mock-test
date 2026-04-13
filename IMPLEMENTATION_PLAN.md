# Mock Knowledge Test Implementation Plan

## Goal

Build a static, shareable mock knowledge test app in `mock_test/` now that the canonical 302-question bank is complete.

The app should:

- simulate the real EPA-style test shape well enough to be useful for revision
- run with no backend and no framework
- work when opened locally and when hosted on GitHub Pages
- keep cheatsheets available as a separate revision view, while still allowing users to open them during or after a paper without losing their place

## Current Inputs

- Canonical question bank: `mock_test/questions.json`
- In-scope modules: `01`, `02`, `03`, `05`-`14`
- Completed cheatsheets: `cheatsheets/*.md` for all in-scope modules
- Real test shape: 30 MCQs, 1 hour, closed book

## Constraints And Decisions

### Fixed constraints

- Static HTML/CSS/JS only
- No backend
- No build step required to run the app
- Must be shareable with classmates
- Module `04` stays out of scope

### Implementation decisions

1. `questions.json` remains the canonical source of truth.
2. The runtime app should not rely on `fetch('questions.json')` as its only loading path, because `file://` handling is inconsistent across browsers.
3. Ship a checked-in JS data file such as `questions_data.js` that exposes the same bank for browser runtime use.
4. `questions_data.js` must be generated from `questions.json` by a tiny checked-in script, not edited by hand.
5. Cheatsheets will be rendered inside the app using a small bundled markdown renderer rather than raw `.md` links.
6. Keep the quiz and cheatsheets as separate views reachable from the same landing page.
7. Allow cheatsheets to be opened during a live paper, but do not pause the timer.
8. Persist enough UI state that a user can return to an in-progress paper or a completed review after switching views or reloading.
9. Default behaviour should optimise for exam simulation first, then add lighter revision features around it.

## Proposed Deliverables

- `mock_test/index.html`
  Landing page and app shell.
- `mock_test/styles.css`
  Static styling for landing, test, results, and cheatsheet views.
- `mock_test/app.js`
  State management, navigation, timer, scoring, review flow, cheatsheet view logic, and browser-local persistence.
- `mock_test/questions_data.js`
  Browser-loadable copy of the canonical question bank.
- `mock_test/generate_questions_data.py`
  Small script to regenerate `questions_data.js` from `questions.json`.
- `mock_test/vendor/`
  Bundled static third-party assets such as a markdown renderer if needed.
- `mock_test/README.md`
  Short usage notes for local opening and GitHub Pages hosting.

## Product Shape

### 1. Landing screen

The first screen should offer two clear paths:

- `Start Mock Test`
- `View Cheatsheets`

It should also show a short summary:

- 30 questions
- 60 minutes
- 13 in-scope modules
- 302-question revision bank

### 2. Mock test mode

This is the primary feature and should feel close to the real assessment.

Core behaviour:

- create a 30-question paper from the full bank
- exclude module `04`
- show one question at a time
- allow next/previous navigation
- allow flagging questions for review
- show remaining time
- auto-submit when timer reaches zero
- prevent answer reveal until the end

Question selection approach:

- guarantee broad coverage across the in-scope modules
- then fill the remaining slots from the wider bank
- never include duplicate questions in the same paper
- randomise question order and option order per session

Recommended default paper generation:

- first pass: include exactly 1 unique question from each in-scope module
- second pass: fill remaining slots randomly, weighted by module bank size

This keeps breadth while still reflecting the larger module pools already in `questions.json`.

Answering rules:

- unanswered questions count as incorrect when the paper is submitted
- `skip` means leave the question unanswered and return later
- no answer feedback is shown during the live test session

### 3. Results and review

After submission, the app should show:

- total score
- percentage
- time used
- module-by-module breakdown
- flagged questions summary

Review mode should then allow the user to step through:

- their chosen answer
- correct answer
- explanation from the bank
- module name and question id

Completed attempts should also remain reopenable from browser-local history so users can revisit answer review later in the same browser.

### 4. Cheatsheets view

This should remain a separate view, but it should not strand the user away from an active paper or a completed review page.

Recommended scope for v1:

- show a module list
- allow opening a cheatsheet per module
- render markdown into a simple readable in-app view
- show a clear return path back to the live test or saved review when relevant

Behaviour note:

- if a cheatsheet is opened during a live paper, the timer continues to run

The key requirement is navigability and readability, not a fully featured document viewer.

## Technical Approach

### App structure

Use a single-page static app with section switching rather than multiple complex pages. A small state object is enough:

- `view`
- `questionBank`
- `sessionQuestions`
- `answers`
- `flagged`
- `currentIndex`
- `timeRemaining`
- `submitted`

### Data handling

- Keep `questions.json` as the editable source
- Regenerate `questions_data.js` from `questions.json` with a checked-in script
- Do not manually edit `questions_data.js`
- Generate `questions_data.js` as:

```js
window.QUESTION_BANK = [/* ... */];
```

- Load the runtime bank from `window.QUESTION_BANK`

This avoids browser restrictions around local JSON fetches while preserving the JSON bank as the canonical dataset.

### Persistence

Use `localStorage` for:

- in-progress session recovery
- last score summary
- completed-paper review history
- current UI context such as the active cheatsheet and currently open review result
- optional settings such as shuffled mode or chosen paper type later

Timer persistence should store an absolute exam end timestamp rather than a decrementing `timeRemaining` value, so page reloads recompute the remaining time correctly.

Persistence should be lightweight and easy to clear.
It is browser-local storage, not a shared account system.

### Cheatsheet rendering

- Bundle a small static markdown renderer with the app
- Load markdown source from the repository and render it into the cheatsheet view
- Avoid raw markdown links as the main UX because they are poor for direct browser use and GitHub Pages

## Delivery Phases

### Phase 1: Skeleton

- create app shell files
- load the question bank in-browser
- render landing screen
- wire basic view switching

### Phase 2: Exam flow

- generate a 30-question paper
- guarantee no duplicate questions per paper
- shuffle question order and option order per session
- implement question navigation
- store answers and flagged state
- implement 60-minute timer and auto-submit
- persist the exam end timestamp for reload recovery

### Phase 3: Results flow

- calculate score
- show answer review
- add module-level performance summary

### Phase 4: Cheatsheets

- add separate cheatsheet index
- wire module-to-cheatsheet mapping
- ensure this view can be opened during or after a paper without losing the return path

### Phase 5: Polish and QA

- improve accessibility and keyboard navigation
- confirm desktop-first layout for realistic exam use
- test on narrow/mobile widths without breaking core usability
- confirm behaviour under `file://`
- confirm behaviour on GitHub Pages
- clean copy and empty-state handling

## Acceptance Criteria

The mock test app is complete when:

- opening `mock_test/index.html` locally works without a server
- the user can start a 30-question timed test from the existing bank
- no paper contains duplicate questions
- option order is shuffled safely without breaking answer correctness
- answers, flags, navigation, and timer all work reliably
- the test auto-submits at 0:00
- reloading during a test restores the session and correct remaining time
- results show score, correct answers, and explanations
- completed papers can be reopened from browser-local history
- cheatsheets are reachable in a separate view
- moving from results to cheatsheets and back preserves the current review context
- moving from a live paper to cheatsheets and back preserves the active paper while the timer continues
- cheatsheets render as readable formatted content inside the app
- no references to module `04` appear in the quiz setup or cheatsheet navigation

## Risks To Manage

### `file://` compatibility

The main implementation risk is local-browser compatibility. The plan avoids this by not depending on runtime JSON fetch for the main experience.

### Cheatsheet rendering scope

Rendering markdown perfectly in-browser is not necessary for v1, but raw markdown links are too weak for the intended experience. A lightweight bundled renderer is the preferred middle ground.

### Data sync drift

`questions_data.js` must be reproducible from `questions.json` by command, otherwise the runtime bank will drift from the canonical bank.

### Overbuilding

This app should prioritise reliable exam practice over extras like analytics, leaderboards, authentication, or fancy dashboards.

## Recommended Build Order

1. Land the basic app shell and local data loading.
2. Finish the full timed exam flow end to end.
3. Add results and explanation review.
4. Add the separate cheatsheet view.
5. Do final polish only after the full path works locally.

## Nice-To-Haves After MVP

- untimed practice mode
- module-specific mini quizzes
- retry only incorrect questions
- question search by module
- export/import score history

These should stay out of the initial delivery unless the core timed test is already solid.
