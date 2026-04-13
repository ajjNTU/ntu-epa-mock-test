(function () {
  "use strict";

  const EXAM_DURATION_SECONDS = 60 * 60;
  const PAPER_SIZE = 30;
  const SESSION_STORAGE_KEY = "ntu_epa_mock_test_session_v1";
  const SCORE_STORAGE_KEY = "ntu_epa_mock_test_score_v1";
  const RESULTS_STORAGE_KEY = "ntu_epa_mock_test_results_v1";
  const UI_STORAGE_KEY = "ntu_epa_mock_test_ui_v1";
  const MAX_RESULT_HISTORY = 20;

  const appRoot = document.getElementById("app");
  const headerActions = document.getElementById("header-actions");

  const state = {
    view: "home",
    questionBank: [],
    cheatsheets: [],
    moduleOrder: [],
    moduleTitles: {},
    session: null,
    result: null,
    resultHistory: [],
    activeCheatsheet: null,
    lastScore: null,
    timerHandle: null,
  };

  init();

  function init() {
    const rawQuestions = Array.isArray(window.QUESTION_BANK) ? window.QUESTION_BANK : [];
    const rawCheatsheets = Array.isArray(window.CHEATSHEET_BANK) ? window.CHEATSHEET_BANK : [];

    state.questionBank = rawQuestions.filter((question) => !String(question.module || "").startsWith("04_"));
    state.cheatsheets = rawCheatsheets.filter((sheet) => !String(sheet.module || "").startsWith("04_"));
    state.moduleTitles = buildModuleTitles(state.cheatsheets, state.questionBank);
    state.moduleOrder = deriveModuleOrder(state.moduleTitles);
    state.activeCheatsheet = state.moduleOrder[0] || null;
    state.lastScore = loadJson(SCORE_STORAGE_KEY);
    state.resultHistory = loadResultHistory();

    if (!state.questionBank.length) {
      renderFatal("Question bank could not be loaded.");
      return;
    }

    bindEvents();

    const savedUiState = loadUiState();
    if (savedUiState && isKnownModule(savedUiState.activeCheatsheet)) {
      state.activeCheatsheet = savedUiState.activeCheatsheet;
    }

    const savedSession = loadJson(SESSION_STORAGE_KEY);
    if (isValidSession(savedSession)) {
      state.session = savedSession;
      if (getRemainingSeconds(savedSession) <= 0) {
        submitSession({ autoSubmitted: true });
        return;
      }
      state.view = savedUiState && savedUiState.view === "cheatsheets" ? "cheatsheets" : "quiz";
    } else if (savedUiState) {
      restoreSavedResult(savedUiState);
      if (savedUiState.view === "results" && state.result) {
        state.view = "results";
      } else if (savedUiState.view === "cheatsheets") {
        state.view = "cheatsheets";
      }
    }
    render();
  }

  function bindEvents() {
    document.addEventListener("click", onClick);
    document.addEventListener("change", onChange);
    document.addEventListener("keydown", onKeydown);
  }

  function onClick(event) {
    const target = event.target.closest("[data-action]");
    if (!target) {
      return;
    }

    const action = target.dataset.action;
    if (action === "home") {
      state.view = "home";
      render();
      return;
    }

    if (action === "start-test") {
      startNewSession();
      return;
    }

    if (action === "resume-test") {
      if (state.session) {
        state.view = "quiz";
        render();
      }
      return;
    }

    if (action === "resume-review") {
      if (state.result) {
        state.view = "results";
        render();
      }
      return;
    }

    if (action === "abandon-test") {
      abandonSession();
      return;
    }

    if (action === "view-cheatsheets") {
      state.view = "cheatsheets";
      render();
      return;
    }

    if (action === "select-cheatsheet") {
      state.activeCheatsheet = target.dataset.module || state.activeCheatsheet;
      state.view = "cheatsheets";
      render();
      return;
    }

    if (action === "open-module-cheatsheet") {
      if (target.dataset.module) {
        state.activeCheatsheet = target.dataset.module;
      }
      state.view = "cheatsheets";
      render();
      return;
    }

    if (action === "prev-question") {
      moveQuestion(-1);
      return;
    }

    if (action === "next-question") {
      moveQuestion(1);
      return;
    }

    if (action === "goto-question") {
      setQuestionIndex(Number(target.dataset.index));
      return;
    }

    if (action === "toggle-flag") {
      toggleFlag();
      return;
    }

    if (action === "submit-test") {
      const unanswered = getUnansweredCount();
      const warning =
        unanswered > 0
          ? `Submit now? ${unanswered} question${unanswered === 1 ? "" : "s"} will count as incorrect.`
          : "Submit this mock test now?";
      if (window.confirm(warning)) {
        submitSession({ autoSubmitted: false });
      }
      return;
    }

    if (action === "new-from-results") {
      state.result = null;
      startNewSession();
      return;
    }

    if (action === "review-jump") {
      if (state.result) {
        state.result.reviewIndex = Number(target.dataset.index);
        render();
      }
      return;
    }

    if (action === "open-history-result") {
      openSavedResult(target.dataset.resultId);
    }
  }

  function onChange(event) {
    const optionInput = event.target.closest("input[data-option-index]");
    if (!optionInput || !state.session) {
      return;
    }

    const question = getCurrentQuestion();
    if (!question) {
      return;
    }

    const optionIndex = Number(optionInput.dataset.optionIndex);
    state.session.answers[question.id] = question.options[optionIndex];
    persistSession();
    syncQuizSelectionUI();
  }

  function onKeydown(event) {
    if (state.view !== "quiz" || !state.session) {
      return;
    }

    const activeTag = document.activeElement ? document.activeElement.tagName : "";
    if (activeTag === "INPUT" || activeTag === "TEXTAREA" || activeTag === "SELECT") {
      return;
    }

    if (event.key === "ArrowLeft") {
      event.preventDefault();
      moveQuestion(-1);
      return;
    }

    if (event.key === "ArrowRight") {
      event.preventDefault();
      moveQuestion(1);
      return;
    }

    if (/^[1-4]$/.test(event.key)) {
      const question = getCurrentQuestion();
      const optionIndex = Number(event.key) - 1;
      if (question && question.options[optionIndex]) {
        state.session.answers[question.id] = question.options[optionIndex];
        persistSession();
        syncQuizSelectionUI();
      }
    }
  }

  function startNewSession() {
    try {
      const selectedQuestions = generatePaper(state.questionBank, state.moduleOrder, PAPER_SIZE);
      state.session = {
        version: 1,
        id: `session-${Date.now()}`,
        startedAt: Date.now(),
        endsAt: Date.now() + EXAM_DURATION_SECONDS * 1000,
        currentIndex: 0,
        questions: selectedQuestions,
        answers: {},
        flagged: {},
      };
      state.result = null;
      state.view = "quiz";
      persistSession();
      render();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to start the mock test.");
    }
  }

  function abandonSession() {
    if (!state.session) {
      return;
    }

    if (!window.confirm("Abandon the current mock test? Progress will be lost.")) {
      return;
    }

    stopTimer();
    state.session = null;
    removeStoredSession();
    state.view = "home";
    render();
  }

  function moveQuestion(delta) {
    if (!state.session) {
      return;
    }
    const nextIndex = clamp(state.session.currentIndex + delta, 0, state.session.questions.length - 1);
    state.session.currentIndex = nextIndex;
    persistSession();
    render();
  }

  function setQuestionIndex(index) {
    if (!state.session || Number.isNaN(index)) {
      return;
    }
    state.session.currentIndex = clamp(index, 0, state.session.questions.length - 1);
    persistSession();
    render();
  }

  function toggleFlag() {
    if (!state.session) {
      return;
    }
    const question = getCurrentQuestion();
    if (!question) {
      return;
    }
    if (state.session.flagged[question.id]) {
      delete state.session.flagged[question.id];
    } else {
      state.session.flagged[question.id] = true;
    }
    persistSession();
    render();
  }

  function submitSession({ autoSubmitted }) {
    if (!state.session) {
      return;
    }

    stopTimer();

    const session = state.session;
    const reviewItems = session.questions.map((question, index) => {
      const chosenAnswer = session.answers[question.id] || null;
      return {
        index,
        question,
        chosenAnswer,
        isCorrect: chosenAnswer === question.answer,
        isFlagged: Boolean(session.flagged[question.id]),
      };
    });

    const correctCount = reviewItems.filter((item) => item.isCorrect).length;
    const moduleBreakdown = state.moduleOrder
      .map((module) => {
        const moduleItems = reviewItems.filter((item) => item.question.module === module);
        if (!moduleItems.length) {
          return null;
        }
        return {
          module,
          title: state.moduleTitles[module],
          correct: moduleItems.filter((item) => item.isCorrect).length,
          total: moduleItems.length,
        };
      })
      .filter(Boolean);

    const result = {
      id: `result-${session.id}`,
      completedAt: Date.now(),
      autoSubmitted,
      startedAt: session.startedAt,
      elapsedSeconds: Math.min(
        EXAM_DURATION_SECONDS,
        Math.max(0, Math.round((Math.min(session.endsAt, Date.now()) - session.startedAt) / 1000))
      ),
      score: correctCount,
      total: session.questions.length,
      percentage: Math.round((correctCount / session.questions.length) * 100),
      flaggedCount: reviewItems.filter((item) => item.isFlagged).length,
      unansweredCount: reviewItems.filter((item) => !item.chosenAnswer).length,
      moduleBreakdown,
      items: reviewItems,
      reviewIndex: 0,
    };

    state.lastScore = {
      completedAt: result.completedAt,
      score: result.score,
      total: result.total,
      percentage: result.percentage,
    };
    saveJson(SCORE_STORAGE_KEY, state.lastScore);
    saveCompletedResult(result);

    state.session = null;
    state.result = result;
    state.view = "results";
    removeStoredSession();
    render();
  }

  function render() {
    renderHeaderActions();
    persistUiState();

    if (state.view === "quiz" && state.session) {
      startTimer();
      renderQuiz();
      return;
    }

    stopTimer();

    if (state.view === "results" && state.result) {
      renderResults();
      return;
    }

    if (state.view === "cheatsheets") {
      renderCheatsheets();
      return;
    }

    renderHome();
  }

  function renderHeaderActions() {
    const actions = [];

    actions.push(buttonHtml("Home", "btn btn-ghost", "home"));

    if (state.session) {
      actions.push(buttonHtml("Cheatsheets", "btn btn-secondary", "view-cheatsheets"));
      actions.push(buttonHtml("Resume Test", "btn btn-primary", "resume-test"));
      actions.push(buttonHtml("Abandon Test", "btn btn-ghost", "abandon-test"));
    } else {
      if (state.result && state.view !== "results") {
        actions.push(buttonHtml("Return to Review", "btn btn-secondary", "resume-review"));
      }
      actions.push(buttonHtml("Cheatsheets", "btn btn-secondary", "view-cheatsheets"));
      actions.push(buttonHtml("New Mock Test", "btn btn-primary", "start-test"));
    }

    headerActions.innerHTML = actions.join("");
  }

  function renderHome() {
    const canStartTest = state.questionBank.length >= PAPER_SIZE;
    const activeSessionBanner = state.session
      ? `
        <div class="warning-banner card">
          <strong>Test in progress.</strong>
          <div class="action-row">
            ${buttonHtml("Resume Timed Test", "btn btn-primary", "resume-test")}
            ${buttonHtml("Abandon Session", "btn btn-ghost", "abandon-test")}
          </div>
        </div>
      `
      : "";

    const lastScoreBanner = state.lastScore
      ? `
        <div class="score-banner card">
          <strong>Last completed paper:</strong>
          ${escapeHtml(
            `${state.lastScore.score}/${state.lastScore.total} (${state.lastScore.percentage}%) on ${formatDateTime(
              state.lastScore.completedAt
            )}`
          )}
        </div>
      `
      : "";

    const historySection = state.resultHistory.length
      ? `
        <section class="card panel">
          <div class="history-heading">
            <div>
              <p class="eyebrow">Saved locally</p>
              <h2>Recent Papers</h2>
            </div>
            <p class="muted-copy">Attempts stay in this browser so you can reopen the review page later.</p>
          </div>
          <div class="history-list">
            ${state.resultHistory
              .slice(0, 8)
              .map(
                (result) => `
                  <div class="history-row">
                    <div class="history-copy">
                      <strong>${escapeHtml(`${result.score}/${result.total} (${result.percentage}%)`)}</strong>
                      <span>${escapeHtml(`${formatDateTime(result.completedAt)} · ${formatDuration(result.elapsedSeconds)} used`)}</span>
                    </div>
                    ${buttonHtml(
                      "Review",
                      "btn btn-secondary",
                      "open-history-result",
                      ` data-result-id="${escapeHtml(result.id)}"`
                    )}
                  </div>
                `
              )
              .join("")}
          </div>
        </section>
      `
      : "";

    const dataWarningBanner = !canStartTest
      ? `
        <div class="warning-banner card">
          <strong>Insufficient questions for a full paper.</strong>
          The current bank has ${escapeHtml(String(state.questionBank.length))} question${state.questionBank.length === 1 ? "" : "s"}, but the mock test requires ${PAPER_SIZE}.
        </div>
      `
      : "";

    appRoot.innerHTML = `
      ${activeSessionBanner}
      ${lastScoreBanner}
      ${dataWarningBanner}
      <section class="hero card">
        <div class="hero-copy">
          <p class="eyebrow">Desktop-first exam simulation</p>
          <h2>Practice the NTU Data Scientist EPA knowledge test with a timed 30-question paper.</h2>
          <p>
            This static app uses the completed 302-question bank across the 13 in-scope modules. The mock paper is timed,
            closed-book in spirit, and designed for direct local use or GitHub Pages sharing.
          </p>
          <div class="pill-row">
            <span class="pill">30 questions</span>
            <span class="pill">60 minutes</span>
            <span class="pill">${state.moduleOrder.length} modules</span>
            <span class="pill">${state.questionBank.length} banked MCQs</span>
          </div>
          <div class="hero-actions">
            ${buttonHtml(
              state.session ? "Resume Mock Test" : "Start Mock Test",
              "btn btn-primary",
              state.session ? "resume-test" : "start-test",
              !state.session && !canStartTest ? " disabled" : ""
            )}
            ${buttonHtml("Browse Cheatsheets", "btn btn-secondary", "view-cheatsheets")}
          </div>
          <p class="footer-note">
            The timer keeps running if you open cheatsheets during a live paper. Your test and review screens stay restorable in this browser.
          </p>
        </div>
        <div class="stat-grid">
          <div class="stat-tile">
            <strong>1</strong>
            Question from each in-scope module is guaranteed before the rest of the paper is filled.
          </div>
          <div class="stat-tile">
            <strong>0</strong>
            Duplicate questions appear in a single paper.
          </div>
          <div class="stat-tile">
            <strong>A-D</strong>
            Option order is shuffled per session while answer matching remains text-safe.
          </div>
          <div class="stat-tile">
            <strong>Local</strong>
            Session state survives reload with the timer restored from an absolute end time.
          </div>
        </div>
      </section>
      ${historySection}
    `;
  }

  function renderQuiz() {
    const question = getCurrentQuestion();
    if (!question) {
      renderFatal("The active session could not be loaded.");
      return;
    }

    const answeredCount = Object.keys(state.session.answers).length;
    const flaggedCount = Object.keys(state.session.flagged).length;
    const unansweredCount = getUnansweredCount();
    const remainingSeconds = getRemainingSeconds(state.session);
    const remainingLabel = formatDuration(remainingSeconds);
    const isUrgent = remainingSeconds <= 5 * 60;

    const optionsHtml = question.options
      .map((option, index) => {
        const isSelected = state.session.answers[question.id] === option;
        return `
          <label class="option-card${isSelected ? " is-selected" : ""}">
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span>
              <input
                type="radio"
                name="question-${escapeHtml(question.id)}"
                data-option-index="${index}"
                ${isSelected ? "checked" : ""}
              >
              ${escapeHtml(option)}
            </span>
          </label>
        `;
      })
      .join("");

    const paletteHtml = state.session.questions
      .map((item, index) => {
        const classes = [
          "palette-button",
          index === state.session.currentIndex ? "is-current" : "",
          state.session.answers[item.id] ? "is-answered" : "",
          state.session.flagged[item.id] ? "is-flagged" : "",
        ]
          .filter(Boolean)
          .join(" ");

        return `
          <button class="${classes}" data-action="goto-question" data-index="${index}">
            ${index + 1}
          </button>
        `;
      })
      .join("");

    appRoot.innerHTML = `
      <section class="quiz-layout">
        <div class="card question-card">
          <div class="question-meta">
            <div>
              <p class="eyebrow">${escapeHtml(moduleLabel(question.module))}</p>
              <h2>Question ${state.session.currentIndex + 1} of ${state.session.questions.length}</h2>
            </div>
            <div>
              <div class="timer${isUrgent ? " is-urgent" : ""}" id="timer" aria-live="off">${remainingLabel}</div>
              <div class="footer-note">Arrow keys navigate. Keys 1-4 select.</div>
            </div>
          </div>

          <p class="question-text">${escapeHtml(question.question)}</p>
          <div class="options">${optionsHtml}</div>

          <div class="question-controls">
            <div class="action-row">
              ${buttonHtml("Previous", "btn btn-ghost", "prev-question", state.session.currentIndex === 0 ? " disabled" : "")}
              ${buttonHtml(state.session.flagged[question.id] ? "Unflag" : "Flag", "btn btn-secondary", "toggle-flag")}
              ${buttonHtml(
                state.session.currentIndex === state.session.questions.length - 1 ? "At Final Question" : "Next",
                "btn btn-ghost",
                "next-question",
                state.session.currentIndex === state.session.questions.length - 1 ? " disabled" : ""
              )}
            </div>
            ${buttonHtml("Submit Test", "btn btn-danger", "submit-test")}
          </div>
        </div>

        <aside class="card panel">
          <h2>Session Status</h2>
          <div class="meta-list">
            <div class="meta-row"><span>Answered</span><strong id="answered-count">${answeredCount}</strong></div>
            <div class="meta-row"><span>Unanswered</span><strong id="unanswered-count">${unansweredCount}</strong></div>
            <div class="meta-row"><span>Flagged</span><strong id="flagged-count">${flaggedCount}</strong></div>
            <div class="meta-row"><span>Time left</span><strong id="time-left-copy">${remainingLabel}</strong></div>
          </div>

          <h3>Question Map</h3>
          <div class="question-grid" id="question-palette">${paletteHtml}</div>

          <div class="notice" style="margin-top: 18px;">
            Unanswered questions count as incorrect on submission. Opening a cheatsheet does not pause the timer.
          </div>

          <div class="action-row">
            ${buttonHtml(
              "Open This Module's Cheatsheet",
              "btn btn-secondary",
              "open-module-cheatsheet",
              ` data-module="${escapeHtml(question.module)}"`
            )}
          </div>
        </aside>
      </section>
    `;
  }

  function renderResults() {
    const result = state.result;
    const reviewItem = result.items[result.reviewIndex] || result.items[0];
    const moduleRows = result.moduleBreakdown
      .map(
        (row) => `
          <div class="module-row">
            <span>${escapeHtml(row.title)}</span>
            <strong>${row.correct}/${row.total}</strong>
          </div>
        `
      )
      .join("");

    const reviewJumpHtml = result.items
      .map((item, index) => {
        const status = !item.chosenAnswer ? "is-unanswered" : item.isCorrect ? "is-right" : "is-wrong";
        const classes = ["review-jump", status, index === result.reviewIndex ? "is-current" : ""].filter(Boolean).join(" ");
        return `
          <button class="${classes}" data-action="review-jump" data-index="${index}">
            ${index + 1}
          </button>
        `;
      })
      .join("");

    const answerCards = reviewItem.question.options
      .map((option) => {
        const classes = ["option-card"];
        if (option === reviewItem.question.answer) {
          classes.push("is-correct");
        }
        if (reviewItem.chosenAnswer === option && option !== reviewItem.question.answer) {
          classes.push("is-incorrect");
        }
        return `
          <div class="${classes.join(" ")}">
            <span class="option-letter">${escapeHtml(option === reviewItem.question.answer ? "✓" : reviewItem.chosenAnswer === option ? "×" : "•")}</span>
            <span>${escapeHtml(option)}</span>
          </div>
        `;
      })
      .join("");

    const statusText = reviewItem.chosenAnswer
      ? reviewItem.isCorrect
        ? "Correct"
        : "Incorrect"
      : "Unanswered";

    appRoot.innerHTML = `
      <section class="results-layout">
        <div class="card panel">
          <h2>Results</h2>
          <div class="summary-grid">
            <div class="summary-card">
              <strong>${result.score}/${result.total}</strong>
              Score
            </div>
            <div class="summary-card">
              <strong>${result.percentage}%</strong>
              Percentage
            </div>
            <div class="summary-card">
              <strong>${formatDuration(result.elapsedSeconds)}</strong>
              Time used
            </div>
            <div class="summary-card">
              <strong>${result.flaggedCount}</strong>
              Flagged questions
            </div>
          </div>

          <div class="notice" style="margin-top: 18px;">
            ${result.autoSubmitted ? "The paper auto-submitted when the timer reached 0:00." : "The paper was submitted manually."}
            Unanswered: ${result.unansweredCount}.
          </div>

          <div class="action-row">
            ${buttonHtml("Start New Paper", "btn btn-primary", "new-from-results")}
            ${buttonHtml("View Cheatsheets", "btn btn-secondary", "view-cheatsheets")}
            ${buttonHtml(
              "Open Current Module Cheatsheet",
              "btn btn-secondary",
              "open-module-cheatsheet",
              ` data-module="${escapeHtml(reviewItem.question.module)}"`
            )}
            ${buttonHtml("Home", "btn btn-ghost", "home")}
          </div>

          <h3 style="margin-top: 24px;">Module Breakdown</h3>
          <div class="module-stats">${moduleRows}</div>

          <h3 style="margin-top: 24px;">Answer Review</h3>
          <div class="review-stack">
            <div class="question-grid">${reviewJumpHtml}</div>
            <div class="notice">
              <strong>${escapeHtml(statusText)}</strong>
              <div>${escapeHtml(moduleLabel(reviewItem.question.module))} · ${escapeHtml(reviewItem.question.id)}</div>
            </div>
            <div>
              <p class="question-text">${escapeHtml(reviewItem.question.question)}</p>
              <div class="options">${answerCards}</div>
            </div>
            <div class="review-explanation">
              <strong>Explanation</strong>
              <p>${escapeHtml(reviewItem.question.explanation)}</p>
            </div>
          </div>
        </div>

        <aside class="card panel">
          <h2>Review Context</h2>
          <div class="meta-list">
            <div class="meta-row"><span>Chosen answer</span><strong>${escapeHtml(reviewItem.chosenAnswer || "No answer")}</strong></div>
            <div class="meta-row"><span>Correct answer</span><strong>${escapeHtml(reviewItem.question.answer)}</strong></div>
            <div class="meta-row"><span>Flagged in test</span><strong>${reviewItem.isFlagged ? "Yes" : "No"}</strong></div>
            <div class="meta-row"><span>Completed at</span><strong>${formatDateTime(result.completedAt)}</strong></div>
          </div>
        </aside>
      </section>
    `;
  }

  function renderCheatsheets() {
    const cheatsheet = state.cheatsheets.find((sheet) => sheet.module === state.activeCheatsheet) || state.cheatsheets[0];
    const returnBanner = state.session
      ? `
        <div class="notice reference-banner">
          <strong>Timed paper still running.</strong>
          The timer has not been paused.
          <div class="action-row">
            ${buttonHtml("Resume Test", "btn btn-primary", "resume-test")}
          </div>
        </div>
      `
      : state.result
      ? `
        <div class="notice reference-banner">
          <strong>Review remains available.</strong>
          This completed paper is saved locally and can be reopened.
          <div class="action-row">
            ${buttonHtml("Return to Review", "btn btn-primary", "resume-review")}
          </div>
        </div>
      `
      : "";
    const moduleButtons = state.cheatsheets
      .map(
        (sheet) => `
          <button
            class="module-button${sheet.module === cheatsheet.module ? " is-active" : ""}"
            data-action="select-cheatsheet"
            data-module="${escapeHtml(sheet.module)}"
          >
            ${escapeHtml(sheet.title)}
          </button>
        `
      )
      .join("");

    appRoot.innerHTML = `
      <section class="cheatsheet-layout">
        <aside class="card panel">
          <h2>Cheatsheets</h2>
          <p class="muted-copy">Revision content stays available before, during, or after a mock test.</p>
          ${returnBanner}
          <div class="review-list">${moduleButtons}</div>
        </aside>

        <article class="card panel">
          <p class="eyebrow">${escapeHtml(moduleLabel(cheatsheet.module))}</p>
          <div class="markdown-content">${renderMarkdown(cheatsheet.markdown)}</div>
        </article>
      </section>
    `;
  }

  function renderFatal(message) {
    stopTimer();
    headerActions.innerHTML = "";
    appRoot.innerHTML = `
      <section class="card panel">
        <h2>App Error</h2>
        <p>${escapeHtml(message)}</p>
      </section>
    `;
  }

  function generatePaper(questionBank, moduleOrder, size) {
    if (size < moduleOrder.length) {
      throw new Error("Paper size is smaller than the number of in-scope modules, so one-per-module coverage cannot be guaranteed.");
    }

    if (questionBank.length < size) {
      throw new Error(`Question bank has ${questionBank.length} questions, but ${size} are required for a full paper.`);
    }

    const grouped = new Map();
    for (const question of questionBank) {
      if (!grouped.has(question.module)) {
        grouped.set(question.module, []);
      }
      grouped.get(question.module).push(question);
    }

    for (const module of moduleOrder) {
      if (!(grouped.get(module) || []).length) {
        throw new Error(`No questions are available for module ${moduleLabel(module)}.`);
      }
    }

    const selected = [];
    const usedIds = new Set();

    for (const module of moduleOrder) {
      const pool = grouped.get(module) || [];
      if (!pool.length) {
        continue;
      }
      const choice = randomFrom(pool.filter((item) => !usedIds.has(item.id)));
      if (choice) {
        selected.push(choice);
        usedIds.add(choice.id);
      }
    }

    const remainingPool = shuffleArray(questionBank.filter((item) => !usedIds.has(item.id)));
    while (selected.length < size && remainingPool.length) {
      const choice = remainingPool.pop();
      if (choice && !usedIds.has(choice.id)) {
        selected.push(choice);
        usedIds.add(choice.id);
      }
    }

    if (selected.length < size) {
      throw new Error(`Only ${selected.length} unique questions could be assembled for a ${size}-question paper.`);
    }

    return shuffleArray(selected).map((question) => ({
      id: question.id,
      module: question.module,
      question: question.question,
      answer: question.answer,
      explanation: question.explanation,
      options: shuffleArray(question.options.slice()),
    }));
  }

  function renderMarkdown(markdown) {
    const lines = String(markdown || "").replace(/\r/g, "").split("\n");
    const html = [];
    let index = 0;

    while (index < lines.length) {
      const line = lines[index];
      const trimmed = line.trim();

      if (!trimmed) {
        index += 1;
        continue;
      }

      if (/^---+$/.test(trimmed)) {
        html.push("<hr>");
        index += 1;
        continue;
      }

      const headingMatch = /^(#{1,6})\s+(.*)$/.exec(trimmed);
      if (headingMatch) {
        const level = headingMatch[1].length;
        html.push(`<h${level}>${renderInline(headingMatch[2])}</h${level}>`);
        index += 1;
        continue;
      }

      if (/^```/.test(trimmed)) {
        const block = [];
        index += 1;
        while (index < lines.length && !/^```/.test(lines[index].trim())) {
          block.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) {
          index += 1;
        }
        html.push(`<pre class="math-block"><code>${escapeHtml(block.join("\n"))}</code></pre>`);
        continue;
      }

      if (trimmed.startsWith("$$") && trimmed.endsWith("$$") && trimmed.length > 4) {
        html.push(`<div class="math-block">${escapeHtml(trimmed.slice(2, -2))}</div>`);
        index += 1;
        continue;
      }

      if (trimmed === "$$") {
        const block = [];
        index += 1;
        while (index < lines.length && lines[index].trim() !== "$$") {
          block.push(lines[index]);
          index += 1;
        }
        if (index < lines.length) {
          index += 1;
        }
        html.push(`<div class="math-block">${escapeHtml(block.join("\n"))}</div>`);
        continue;
      }

      if (/^>\s?/.test(trimmed)) {
        const block = [];
        while (index < lines.length && /^>\s?/.test(lines[index].trim())) {
          block.push(lines[index].trim().replace(/^>\s?/, ""));
          index += 1;
        }
        html.push(`<blockquote><p>${block.map(renderInline).join("<br>")}</p></blockquote>`);
        continue;
      }

      if (isTableStart(lines, index)) {
        const tableLines = [];
        while (index < lines.length && /^\|.*\|$/.test(lines[index].trim())) {
          tableLines.push(lines[index].trim());
          index += 1;
        }
        html.push(renderTable(tableLines));
        continue;
      }

      if (/^[-*+] /.test(trimmed)) {
        const items = [];
        while (index < lines.length && /^[-*+] /.test(lines[index].trim())) {
          items.push(lines[index].trim().replace(/^[-*+] /, ""));
          index += 1;
        }
        html.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
        continue;
      }

      if (/^\d+\.\s+/.test(trimmed)) {
        const items = [];
        while (index < lines.length && /^\d+\.\s+/.test(lines[index].trim())) {
          items.push(lines[index].trim().replace(/^\d+\.\s+/, ""));
          index += 1;
        }
        html.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
        continue;
      }

      const paragraph = [];
      while (index < lines.length && lines[index].trim() && !startsBlock(lines, index)) {
        paragraph.push(lines[index].trim());
        index += 1;
      }
      html.push(`<p>${paragraph.map(renderInline).join("<br>")}</p>`);
    }

    return html.join("");
  }

  function startsBlock(lines, index) {
    const trimmed = lines[index].trim();
    return (
      /^---+$/.test(trimmed) ||
      /^(#{1,6})\s+/.test(trimmed) ||
      /^```/.test(trimmed) ||
      trimmed === "$$" ||
      (trimmed.startsWith("$$") && trimmed.endsWith("$$")) ||
      /^>\s?/.test(trimmed) ||
      /^\|.*\|$/.test(trimmed) ||
      /^[-*+] /.test(trimmed) ||
      /^\d+\.\s+/.test(trimmed)
    );
  }

  function isTableStart(lines, index) {
    const current = lines[index] ? lines[index].trim() : "";
    const next = lines[index + 1] ? lines[index + 1].trim() : "";
    return /^\|.*\|$/.test(current) && /^\|[\s\-|:]+\|$/.test(next);
  }

  function renderTable(tableLines) {
    if (tableLines.length < 2) {
      return "";
    }
    const [headerLine, , ...bodyLines] = tableLines;
    const headers = splitTableRow(headerLine);
    const body = bodyLines
      .map((row) => splitTableRow(row))
      .map(
        (cells) => `
          <tr>${cells.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>
        `
      )
      .join("");

    return `
      <table>
        <thead>
          <tr>${headers.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr>
        </thead>
        <tbody>${body}</tbody>
      </table>
    `;
  }

  function splitTableRow(row) {
    return row
      .replace(/^\|/, "")
      .replace(/\|$/, "")
      .split("|")
      .map((cell) => cell.trim());
  }

  function renderInline(text) {
    let output = escapeHtml(text);
    output = output.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noreferrer noopener">$1</a>');
    output = output.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    output = output.replace(/(^|[\s(])\*(?!\*)([^*]+)\*(?!\*)/g, '$1<em>$2</em>');
    output = output.replace(/(^|[\s(])_([^_]+)_/g, '$1<em>$2</em>');
    output = output.replace(/`([^`]+)`/g, "<code>$1</code>");
    output = output.replace(/\bSTAR:/g, '<span class="star-badge">STAR:</span>');
    output = output.replace(/⭐/g, '<span class="star-badge" aria-label="priority topic">⭐</span>');
    return output;
  }

  function syncQuizSelectionUI() {
    if (state.view !== "quiz" || !state.session) {
      return;
    }

    const question = getCurrentQuestion();
    if (!question) {
      return;
    }

    const selectedAnswer = state.session.answers[question.id] || null;
    const optionCards = appRoot.querySelectorAll(".option-card");
    optionCards.forEach((card, index) => {
      const isSelected = question.options[index] === selectedAnswer;
      card.classList.toggle("is-selected", isSelected);
      const radio = card.querySelector("input[type='radio']");
      if (radio) {
        radio.checked = isSelected;
      }
    });

    const answeredCountNode = document.getElementById("answered-count");
    const unansweredCountNode = document.getElementById("unanswered-count");
    const flaggedCountNode = document.getElementById("flagged-count");
    const currentPaletteButton = appRoot.querySelector(".palette-button.is-current");

    if (answeredCountNode) {
      answeredCountNode.textContent = String(Object.keys(state.session.answers).length);
    }
    if (unansweredCountNode) {
      unansweredCountNode.textContent = String(getUnansweredCount());
    }
    if (flaggedCountNode) {
      flaggedCountNode.textContent = String(Object.keys(state.session.flagged).length);
    }
    if (currentPaletteButton) {
      currentPaletteButton.classList.toggle("is-answered", Boolean(selectedAnswer));
    }
  }

  function getCurrentQuestion() {
    return state.session ? state.session.questions[state.session.currentIndex] : null;
  }

  function getRemainingSeconds(session) {
    return Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000));
  }

  function getUnansweredCount() {
    if (!state.session) {
      return 0;
    }
    return state.session.questions.filter((question) => !state.session.answers[question.id]).length;
  }

  function startTimer() {
    if (state.timerHandle || !state.session) {
      return;
    }
    state.timerHandle = window.setInterval(() => {
      if (!state.session) {
        stopTimer();
        return;
      }
      const remainingSeconds = getRemainingSeconds(state.session);
      const timerNode = document.getElementById("timer");
      const timeCopyNode = document.getElementById("time-left-copy");
      if (timerNode) {
        timerNode.textContent = formatDuration(remainingSeconds);
        timerNode.classList.toggle("is-urgent", remainingSeconds <= 5 * 60);
      }
      if (timeCopyNode) {
        timeCopyNode.textContent = formatDuration(remainingSeconds);
      }
      if (remainingSeconds <= 0) {
        submitSession({ autoSubmitted: true });
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timerHandle) {
      window.clearInterval(state.timerHandle);
      state.timerHandle = null;
    }
  }

  function persistSession() {
    if (state.session) {
      saveJson(SESSION_STORAGE_KEY, state.session);
    }
  }

  function removeStoredSession() {
    window.localStorage.removeItem(SESSION_STORAGE_KEY);
  }

  function restoreSavedResult(savedUiState) {
    if (!savedUiState || !savedUiState.activeResultId) {
      return;
    }
    const match = state.resultHistory.find((result) => result.id === savedUiState.activeResultId);
    if (!match) {
      return;
    }
    const reviewIndex = Number(savedUiState.reviewIndex);
    match.reviewIndex = Number.isInteger(reviewIndex) ? clamp(reviewIndex, 0, match.items.length - 1) : match.reviewIndex || 0;
    state.result = match;
  }

  function openSavedResult(resultId) {
    const match = state.resultHistory.find((result) => result.id === resultId);
    if (!match) {
      return;
    }
    state.result = match;
    state.view = "results";
    render();
  }

  function saveCompletedResult(result) {
    state.resultHistory = [result, ...state.resultHistory.filter((item) => item.id !== result.id)].slice(0, MAX_RESULT_HISTORY);
    saveJson(RESULTS_STORAGE_KEY, state.resultHistory);
  }

  function persistUiState() {
    saveJson(UI_STORAGE_KEY, {
      view: state.view,
      activeCheatsheet: state.activeCheatsheet,
      activeResultId: state.result ? state.result.id : null,
      reviewIndex: state.result ? state.result.reviewIndex : 0,
    });

    if (state.resultHistory.length) {
      saveJson(RESULTS_STORAGE_KEY, state.resultHistory);
    }
  }

  function loadUiState() {
    const saved = loadJson(UI_STORAGE_KEY);
    return saved && typeof saved === "object" ? saved : null;
  }

  function loadResultHistory() {
    const saved = loadJson(RESULTS_STORAGE_KEY);
    if (!Array.isArray(saved)) {
      return [];
    }
    return saved.filter(isValidResult).slice(0, MAX_RESULT_HISTORY);
  }

  function buildModuleTitles(cheatsheets, questionBank) {
    const titles = {};
    for (const sheet of cheatsheets) {
      titles[sheet.module] = sheet.title;
    }
    for (const question of questionBank) {
      if (!titles[question.module]) {
        titles[question.module] = titleFromModule(question.module);
      }
    }
    return titles;
  }

  function deriveModuleOrder(moduleTitles) {
    return Object.keys(moduleTitles).sort((left, right) => {
      const leftCode = Number(String(left).split("_")[0]);
      const rightCode = Number(String(right).split("_")[0]);
      return leftCode - rightCode;
    });
  }

  function moduleLabel(module) {
    return state.moduleTitles[module] || titleFromModule(module);
  }

  function isKnownModule(module) {
    return typeof module === "string" && state.moduleOrder.includes(module);
  }

  function titleFromModule(module) {
    return String(module || "")
      .replace(/^\d+_/, "")
      .split("_")
      .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
      .join(" ");
  }

  function isValidSession(session) {
    return Boolean(
      session &&
        session.version === 1 &&
        Array.isArray(session.questions) &&
        typeof session.currentIndex === "number" &&
        session.endsAt &&
        session.startedAt &&
        session.answers &&
        session.flagged
    );
  }

  function isValidResult(result) {
    return Boolean(
      result &&
        typeof result.id === "string" &&
        Array.isArray(result.items) &&
        typeof result.score === "number" &&
        typeof result.total === "number" &&
        typeof result.completedAt === "number"
    );
  }

  function buttonHtml(label, className, action, extraAttributes) {
    return `<button class="${className}" data-action="${action}"${extraAttributes || ""}>${label}</button>`;
  }

  function loadJson(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function saveJson(key, value) {
    window.localStorage.setItem(key, JSON.stringify(value));
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatDuration(totalSeconds) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatDateTime(timestamp) {
    return new Intl.DateTimeFormat("en-GB", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date(timestamp));
  }

  function randomFrom(items) {
    if (!items.length) {
      return null;
    }
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffleArray(items) {
    const copy = items.slice();
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const swapIndex = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[swapIndex]] = [copy[swapIndex], copy[index]];
    }
    return copy;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }
})();
