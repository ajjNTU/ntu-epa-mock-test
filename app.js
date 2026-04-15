(function () {
  "use strict";

  const EXAM_DURATION_SECONDS = 60 * 60;
  const PAPER_SIZE = 30;
  const MOCK_SESSION_STORAGE_KEY = "ntu_epa_mock_test_session_v1";
  const PRACTICE_SESSION_STORAGE_KEY = "ntu_epa_module_practice_session_v1";
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
    moduleQuestionCounts: {},
    mockSession: null,
    practiceSession: null,
    activeSessionMode: null,
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
    state.moduleQuestionCounts = buildModuleQuestionCounts(state.questionBank);
    state.activeCheatsheet = state.moduleOrder[0] || null;
    state.lastScore = loadLastScore();
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

    state.mockSession = loadSavedSession("mock");
    state.practiceSession = loadSavedSession("module-practice");

    if (state.mockSession && getRemainingSeconds(state.mockSession) <= 0) {
      state.activeSessionMode = "mock";
      submitSession({ autoSubmitted: true, mode: "mock" });
      return;
    }

    if (
      savedUiState &&
      isKnownSessionMode(savedUiState.activeSessionMode) &&
      getSessionByMode(savedUiState.activeSessionMode)
    ) {
      state.activeSessionMode = savedUiState.activeSessionMode;
    } else if (state.mockSession) {
      state.activeSessionMode = "mock";
    } else if (state.practiceSession) {
      state.activeSessionMode = "module-practice";
    }

    if (state.mockSession || state.practiceSession) {
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
      startMockSession();
      return;
    }

    if (action === "resume-test") {
      resumeSession("mock");
      return;
    }

    if (action === "resume-module-practice") {
      resumeSession("module-practice");
      return;
    }

    if (action === "start-module-practice") {
      startModulePractice(target.dataset.module || state.activeCheatsheet);
      return;
    }

    if (action === "resume-review") {
      if (state.result) {
        state.view = "results";
        render();
      }
      return;
    }

    if (action === "abandon-session") {
      abandonSession(target.dataset.mode || state.activeSessionMode);
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
      restartResultSession();
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
    const session = getActiveSession();
    if (!optionInput || !session) {
      return;
    }

    const question = getCurrentQuestion();
    if (!question) {
      return;
    }

    const optionIndex = Number(optionInput.dataset.optionIndex);
    if (session.mode === "module-practice" && session.revealed[question.id]) {
      return;
    }

    session.answers[question.id] = question.options[optionIndex];
    if (session.mode === "module-practice") {
      session.revealed[question.id] = true;
      persistSession(session.mode);
      render();
      return;
    }

    persistSession(session.mode);
    syncQuizSelectionUI();
  }

  function onKeydown(event) {
    const session = getActiveSession();
    if (state.view !== "quiz" || !session) {
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
        if (session.mode === "module-practice" && session.revealed[question.id]) {
          return;
        }
        session.answers[question.id] = question.options[optionIndex];
        if (session.mode === "module-practice") {
          session.revealed[question.id] = true;
          persistSession(session.mode);
          render();
          return;
        }
        persistSession(session.mode);
        syncQuizSelectionUI();
      }
    }
  }

  function startMockSession() {
    try {
      const selectedQuestions = generatePaper(state.questionBank, state.moduleOrder, PAPER_SIZE);
      state.mockSession = {
        version: 2,
        mode: "mock",
        id: `session-${Date.now()}`,
        startedAt: Date.now(),
        endsAt: Date.now() + EXAM_DURATION_SECONDS * 1000,
        currentIndex: 0,
        questions: selectedQuestions,
        answers: {},
        flagged: {},
        revealed: {},
      };
      state.activeSessionMode = "mock";
      state.result = null;
      state.view = "quiz";
      persistSession("mock");
      render();
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "Unable to start the mock test.");
    }
  }

  function startModulePractice(module) {
    if (!isKnownModule(module)) {
      return;
    }

    const existingPractice = state.practiceSession;
    if (
      existingPractice &&
      existingPractice.module !== module &&
      !window.confirm(
        `Start ${moduleLabel(module)} practice? Your saved ${moduleLabel(existingPractice.module)} practice will be replaced.`
      )
    ) {
      return;
    }

    const moduleQuestions = state.questionBank.filter((question) => question.module === module);
    if (!moduleQuestions.length) {
      window.alert(`No questions are available for ${moduleLabel(module)}.`);
      return;
    }

    state.practiceSession = {
      version: 2,
      mode: "module-practice",
      module,
      id: `practice-${Date.now()}`,
      startedAt: Date.now(),
      currentIndex: 0,
      questions: prepareSessionQuestions(moduleQuestions),
      answers: {},
      flagged: {},
      revealed: {},
    };
    state.activeSessionMode = "module-practice";
    state.result = null;
    state.view = "quiz";
    persistSession("module-practice");
    render();
  }

  function resumeSession(mode) {
    const session = getSessionByMode(mode);
    if (!session) {
      return;
    }

    if (mode === "mock" && getRemainingSeconds(session) <= 0) {
      state.activeSessionMode = "mock";
      submitSession({ autoSubmitted: true, mode: "mock" });
      return;
    }

    state.activeSessionMode = mode;
    state.view = "quiz";
    render();
  }

  function abandonSession(mode) {
    const session = getSessionByMode(mode);
    if (!session) {
      return;
    }

    const label = session.mode === "mock" ? "the current mock test" : `${moduleLabel(session.module)} module practice`;
    if (!window.confirm(`Abandon ${label}? Progress will be lost.`)) {
      return;
    }

    if (mode === "mock" && state.activeSessionMode === "mock") {
      stopTimer();
    }

    setSessionByMode(mode, null);
    removeStoredSession(mode);
    if (state.activeSessionMode === mode) {
      state.activeSessionMode = state.mockSession ? "mock" : state.practiceSession ? "module-practice" : null;
      state.view = "home";
    }
    render();
  }

  function restartResultSession() {
    if (!state.result) {
      return;
    }

    const result = state.result;
    state.result = null;
    if (result.mode === "module-practice" && result.module) {
      startModulePractice(result.module);
      return;
    }
    startMockSession();
  }

  function moveQuestion(delta) {
    const session = getActiveSession();
    if (!session) {
      return;
    }
    const nextIndex = clamp(session.currentIndex + delta, 0, session.questions.length - 1);
    session.currentIndex = nextIndex;
    persistSession(session.mode);
    render();
  }

  function setQuestionIndex(index) {
    const session = getActiveSession();
    if (!session || Number.isNaN(index)) {
      return;
    }
    session.currentIndex = clamp(index, 0, session.questions.length - 1);
    persistSession(session.mode);
    render();
  }

  function toggleFlag() {
    const session = getActiveSession();
    if (!session) {
      return;
    }
    const question = getCurrentQuestion();
    if (!question) {
      return;
    }
    if (session.flagged[question.id]) {
      delete session.flagged[question.id];
    } else {
      session.flagged[question.id] = true;
    }
    persistSession(session.mode);
    render();
  }

  function submitSession({ autoSubmitted, mode }) {
    const session = mode ? getSessionByMode(mode) : getActiveSession();
    if (!session) {
      return;
    }

    if (session.mode === "mock") {
      stopTimer();
    }

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
      mode: session.mode,
      module: session.mode === "module-practice" ? session.module : null,
      completedAt: Date.now(),
      autoSubmitted,
      startedAt: session.startedAt,
      elapsedSeconds:
        session.mode === "mock"
          ? Math.min(EXAM_DURATION_SECONDS, Math.max(0, Math.round((Math.min(session.endsAt, Date.now()) - session.startedAt) / 1000)))
          : Math.max(0, Math.round((Date.now() - session.startedAt) / 1000)),
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
      mode: result.mode,
      module: result.module,
      completedAt: result.completedAt,
      score: result.score,
      total: result.total,
      percentage: result.percentage,
    };
    saveJson(SCORE_STORAGE_KEY, state.lastScore);
    saveCompletedResult(result);

    setSessionByMode(session.mode, null);
    if (state.activeSessionMode === session.mode) {
      state.activeSessionMode = state.mockSession ? "mock" : state.practiceSession ? "module-practice" : null;
    }
    state.result = result;
    state.view = "results";
    removeStoredSession(session.mode);
    render();
  }

  function render() {
    renderHeaderActions();
    persistUiState();

    if (state.view === "quiz" && getActiveSession()) {
      const session = getActiveSession();
      if (session && session.mode === "mock") {
        startTimer();
      } else {
        stopTimer();
      }
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
    const activeSession = getActiveSession();

    actions.push(buttonHtml("Home", "btn btn-ghost", "home"));

    if (state.result && state.view !== "results") {
      actions.push(buttonHtml("Return to Review", "btn btn-secondary", "resume-review"));
    }

    actions.push(buttonHtml("Cheatsheets", "btn btn-secondary", "view-cheatsheets"));

    if (state.mockSession) {
      actions.push(
        buttonHtml(
          state.activeSessionMode === "mock" && state.view === "quiz" ? "Mock Test Open" : "Resume Mock Test",
          state.activeSessionMode === "mock" && state.view === "quiz" ? "btn btn-primary" : "btn btn-secondary",
          "resume-test"
        )
      );
    } else {
      actions.push(buttonHtml("New Mock Test", "btn btn-primary", "start-test"));
    }

    if (state.practiceSession) {
      actions.push(
        buttonHtml(
          state.activeSessionMode === "module-practice" && state.view === "quiz"
            ? "Module Practice Open"
            : "Resume Module Practice",
          state.activeSessionMode === "module-practice" && state.view === "quiz" ? "btn btn-primary" : "btn btn-secondary",
          "resume-module-practice"
        )
      );
    }

    if (activeSession) {
      actions.push(
        buttonHtml(
          activeSession.mode === "mock" ? "Abandon Mock Test" : "Abandon Practice",
          "btn btn-ghost",
          "abandon-session",
          ` data-mode="${escapeHtml(activeSession.mode)}"`
        )
      );
    }

    headerActions.innerHTML = actions.join("");
  }

  function renderHome() {
    const canStartTest = state.questionBank.length >= PAPER_SIZE;
    const mockSessionBanner = state.mockSession
      ? `
        <div class="warning-banner card">
          <strong>Test in progress.</strong>
          <div class="action-row">
            ${buttonHtml("Resume Timed Test", "btn btn-primary", "resume-test")}
            ${buttonHtml("Abandon Session", "btn btn-ghost", "abandon-session", ' data-mode="mock"')}
          </div>
        </div>
      `
      : "";

    const practiceSessionBanner = state.practiceSession
      ? `
        <div class="score-banner card">
          <strong>${escapeHtml(`${moduleLabel(state.practiceSession.module)} practice saved.`)}</strong>
          <div class="action-row">
            ${buttonHtml("Resume Module Practice", "btn btn-primary", "resume-module-practice")}
            ${buttonHtml("Abandon Practice", "btn btn-ghost", "abandon-session", ' data-mode="module-practice"')}
          </div>
        </div>
      `
      : "";

    const lastScoreBanner = state.lastScore
      ? `
        <div class="score-banner card">
          <strong>Last completed attempt:</strong>
          ${escapeHtml(
            `${resultDisplayName(state.lastScore)} · ${state.lastScore.score}/${state.lastScore.total} (${state.lastScore.percentage}%) on ${formatDateTime(
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
              <h2>Recent Attempts</h2>
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
                      <strong>${escapeHtml(`${resultDisplayName(result)} · ${result.score}/${result.total} (${result.percentage}%)`)}</strong>
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
      ${mockSessionBanner}
      ${practiceSessionBanner}
      ${lastScoreBanner}
      ${dataWarningBanner}
      <section class="hero card">
        <div class="hero-copy">
          <p class="eyebrow">Desktop-first exam simulation</p>
          <h2>Practice the NTU Data Scientist EPA knowledge test with a timed 30-question paper.</h2>
          <p>
            This static app uses the completed 302-question bank across the 13 in-scope modules. The mock paper is timed,
            closed-book in spirit, and designed for direct local use or GitHub Pages sharing. Each cheatsheet also opens an
            untimed module-practice run using every question tagged to that module.
          </p>
          <div class="pill-row">
            <span class="pill">30 questions</span>
            <span class="pill">60 minutes</span>
            <span class="pill">${state.moduleOrder.length} modules</span>
            <span class="pill">${state.questionBank.length} banked MCQs</span>
          </div>
          <div class="hero-actions">
            ${buttonHtml(
              state.mockSession ? "Resume Mock Test" : "Start Mock Test",
              "btn btn-primary",
              state.mockSession ? "resume-test" : "start-test",
              !state.mockSession && !canStartTest ? " disabled" : ""
            )}
            ${buttonHtml("Browse Cheatsheets", "btn btn-secondary", "view-cheatsheets")}
          </div>
          <p class="footer-note">
            Timed mock sessions and untimed module-practice sessions are saved separately in this browser.
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
    const session = getActiveSession();
    const question = getCurrentQuestion();
    if (!session || !question) {
      renderFatal("The active session could not be loaded.");
      return;
    }

    const answeredCount = Object.keys(session.answers).length;
    const flaggedCount = Object.keys(session.flagged).length;
    const unansweredCount = getUnansweredCount();
    const remainingSeconds = session.mode === "mock" ? getRemainingSeconds(session) : 0;
    const remainingLabel = session.mode === "mock" ? formatDuration(remainingSeconds) : "Untimed";
    const isUrgent = session.mode === "mock" && remainingSeconds <= 5 * 60;
    const statusLabel = session.mode === "mock" ? "Timed Mock Test" : `${moduleLabel(session.module)} Practice`;
    const statusNote =
      session.mode === "mock"
        ? "Arrow keys navigate. Keys 1-4 select."
        : "Untimed practice. Answers save locally in this browser.";
    const isPracticeRevealed = session.mode === "module-practice" && Boolean(session.revealed[question.id]);
    const selectedAnswer = session.answers[question.id] || null;
    const practiceExplanation =
      session.mode === "module-practice" && isPracticeRevealed
        ? `
          <div class="review-explanation inline-feedback">
            <strong>${escapeHtml(selectedAnswer === question.answer ? "Correct" : "Incorrect")}</strong>
            <p><strong>Answer:</strong> ${escapeHtml(question.answer)}</p>
            <p>${escapeHtml(question.explanation)}</p>
          </div>
        `
        : session.mode === "module-practice"
        ? `
          <div class="notice inline-feedback">
            Choose an answer to reveal the result and explanation straight away.
          </div>
        `
        : "";

    const optionsHtml = question.options
      .map((option, index) => {
        const isSelected = selectedAnswer === option;
        const classes = ["option-card"];
        if (isSelected) {
          classes.push("is-selected");
        }
        if (isPracticeRevealed && option === question.answer) {
          classes.push("is-correct");
        }
        if (isPracticeRevealed && isSelected && option !== question.answer) {
          classes.push("is-incorrect");
        }
        return `
          <label class="${classes.join(" ")}">
            <span class="option-letter">${String.fromCharCode(65 + index)}</span>
            <span>
              <input
                type="radio"
                name="question-${escapeHtml(question.id)}"
                data-option-index="${index}"
                ${isSelected ? "checked" : ""}
                ${isPracticeRevealed ? "disabled" : ""}
              >
              ${escapeHtml(option)}
            </span>
          </label>
        `;
      })
      .join("");

    const paletteHtml = session.questions
      .map((item, index) => {
        const classes = [
          "palette-button",
          index === session.currentIndex ? "is-current" : "",
          session.answers[item.id] ? "is-answered" : "",
          session.flagged[item.id] ? "is-flagged" : "",
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
              <h2>Question ${session.currentIndex + 1} of ${session.questions.length}</h2>
            </div>
            <div>
              <div class="timer${isUrgent ? " is-urgent" : ""}" id="timer" aria-live="off">${remainingLabel}</div>
              <div class="footer-note">${escapeHtml(statusNote)}</div>
            </div>
          </div>

          <p class="question-text">${escapeHtml(question.question)}</p>
          <div class="options">${optionsHtml}</div>
          ${practiceExplanation}

          <div class="question-controls">
            <div class="action-row">
              ${buttonHtml("Previous", "btn btn-ghost", "prev-question", session.currentIndex === 0 ? " disabled" : "")}
              ${buttonHtml(session.flagged[question.id] ? "Unflag" : "Flag", "btn btn-secondary", "toggle-flag")}
              ${buttonHtml(
                session.currentIndex === session.questions.length - 1 ? "At Final Question" : "Next",
                "btn btn-ghost",
                "next-question",
                session.currentIndex === session.questions.length - 1 ? " disabled" : ""
              )}
            </div>
            ${buttonHtml(session.mode === "mock" ? "Submit Test" : "Finish Practice", "btn btn-danger", "submit-test")}
          </div>
        </div>

        <aside class="card panel">
          <h2>${escapeHtml(statusLabel)}</h2>
          <div class="meta-list">
            <div class="meta-row"><span>Answered</span><strong id="answered-count">${answeredCount}</strong></div>
            <div class="meta-row"><span>Unanswered</span><strong id="unanswered-count">${unansweredCount}</strong></div>
            <div class="meta-row"><span>Flagged</span><strong id="flagged-count">${flaggedCount}</strong></div>
            <div class="meta-row"><span>${session.mode === "mock" ? "Time left" : "Mode"}</span><strong id="time-left-copy">${escapeHtml(remainingLabel)}</strong></div>
          </div>

          <h3>Question Map</h3>
          <div class="question-grid" id="question-palette">${paletteHtml}</div>

          <div class="notice" style="margin-top: 18px;">
            ${
              session.mode === "mock"
                ? "Unanswered questions count as incorrect on submission. Opening a cheatsheet does not pause the timer."
                : "Module practice is untimed, gives instant feedback, and stays separate from any live mock test."
            }
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
    const resultName = resultDisplayName(result);
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
          <h2>${escapeHtml(resultName)} Results</h2>
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
            ${
              result.mode === "mock"
                ? result.autoSubmitted
                  ? "The paper auto-submitted when the timer reached 0:00."
                  : "The paper was submitted manually."
                : "This untimed module practice was finished manually."
            }
            Unanswered: ${result.unansweredCount}.
          </div>

          <div class="action-row">
            ${buttonHtml(result.mode === "mock" ? "Start New Paper" : "Restart Module Practice", "btn btn-primary", "new-from-results")}
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
    const questionCount = getModuleQuestionCount(cheatsheet.module);
    const hasSavedPractice = Boolean(state.practiceSession);
    const isCurrentPracticeModule = hasSavedPractice && state.practiceSession.module === cheatsheet.module;
    const practiceButtons = isCurrentPracticeModule
      ? buttonHtml("Resume Module Practice", "btn btn-primary", "resume-module-practice")
      : hasSavedPractice
      ? [
          buttonHtml("Resume Saved Practice", "btn btn-secondary", "resume-module-practice"),
          buttonHtml(
            `Start ${escapeHtml(moduleLabel(cheatsheet.module))} Practice`,
            "btn btn-primary",
            "start-module-practice",
            ` data-module="${escapeHtml(cheatsheet.module)}"`
          ),
        ].join("")
      : buttonHtml(
          "Start Untimed Module Practice",
          "btn btn-primary",
          "start-module-practice",
          ` data-module="${escapeHtml(cheatsheet.module)}"`
        );

    const returnBanners = [
      state.mockSession
        ? `
          <div class="notice reference-banner">
            <strong>Timed mock still running.</strong>
            Its timer is still based on the saved end time.
            <div class="action-row">
              ${buttonHtml("Resume Mock Test", "btn btn-primary", "resume-test")}
            </div>
          </div>
        `
        : "",
      state.practiceSession
        ? `
          <div class="notice reference-banner">
            <strong>${escapeHtml(`${moduleLabel(state.practiceSession.module)} practice saved.`)}</strong>
            Module practice is stored separately from the timed mock.
            <div class="action-row">
              ${buttonHtml("Resume Module Practice", "btn btn-primary", "resume-module-practice")}
            </div>
          </div>
        `
        : "",
      !state.mockSession && !state.practiceSession && state.result
      ? `
        <div class="notice reference-banner">
          <strong>Review remains available.</strong>
          This completed attempt is saved locally and can be reopened.
          <div class="action-row">
            ${buttonHtml("Return to Review", "btn btn-primary", "resume-review")}
          </div>
        </div>
      `
      : "",
    ]
      .filter(Boolean)
      .join("");
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
          <p class="muted-copy">Revision content stays available before, during, or after a mock test or module-practice run.</p>
          ${returnBanners}
          <div class="review-list">${moduleButtons}</div>
        </aside>

        <article class="card panel">
          <p class="eyebrow">${escapeHtml(moduleLabel(cheatsheet.module))}</p>
          <section class="practice-callout">
            <div class="practice-callout-copy">
              <strong>${escapeHtml(`${questionCount} question${questionCount === 1 ? "" : "s"}`)}</strong>
              <p>Work through every question tagged to this module in untimed practice mode.</p>
            </div>
            <div class="action-row">
              ${practiceButtons}
            </div>
          </section>
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

    return prepareSessionQuestions(selected);
  }

  function prepareSessionQuestions(questions) {
    return shuffleArray(questions).map((question) => ({
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
    const session = getActiveSession();
    if (state.view !== "quiz" || !session) {
      return;
    }

    const question = getCurrentQuestion();
    if (!question) {
      return;
    }

    const selectedAnswer = session.answers[question.id] || null;
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
      answeredCountNode.textContent = String(Object.keys(session.answers).length);
    }
    if (unansweredCountNode) {
      unansweredCountNode.textContent = String(getUnansweredCount());
    }
    if (flaggedCountNode) {
      flaggedCountNode.textContent = String(Object.keys(session.flagged).length);
    }
    if (currentPaletteButton) {
      currentPaletteButton.classList.toggle("is-answered", Boolean(selectedAnswer));
    }
  }

  function getCurrentQuestion() {
    const session = getActiveSession();
    return session ? session.questions[session.currentIndex] : null;
  }

  function getRemainingSeconds(session) {
    return Math.max(0, Math.ceil((session.endsAt - Date.now()) / 1000));
  }

  function getUnansweredCount() {
    const session = getActiveSession();
    if (!session) {
      return 0;
    }
    return session.questions.filter((question) => !session.answers[question.id]).length;
  }

  function startTimer() {
    const session = getActiveSession();
    if (state.timerHandle || !session || session.mode !== "mock") {
      return;
    }
    state.timerHandle = window.setInterval(() => {
      const activeSession = getActiveSession();
      if (!activeSession || activeSession.mode !== "mock") {
        stopTimer();
        return;
      }
      const remainingSeconds = getRemainingSeconds(activeSession);
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
        submitSession({ autoSubmitted: true, mode: "mock" });
      }
    }, 1000);
  }

  function stopTimer() {
    if (state.timerHandle) {
      window.clearInterval(state.timerHandle);
      state.timerHandle = null;
    }
  }

  function persistSession(mode) {
    const session = getSessionByMode(mode);
    if (session) {
      saveJson(getSessionStorageKey(mode), session);
    }
  }

  function removeStoredSession(mode) {
    window.localStorage.removeItem(getSessionStorageKey(mode));
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
      activeSessionMode: state.activeSessionMode,
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
    return saved.map(normalizeResult).filter(isValidResult).slice(0, MAX_RESULT_HISTORY);
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

  function buildModuleQuestionCounts(questionBank) {
    const counts = {};
    for (const question of questionBank) {
      counts[question.module] = (counts[question.module] || 0) + 1;
    }
    return counts;
  }

  function getModuleQuestionCount(module) {
    return state.moduleQuestionCounts[module] || 0;
  }

  function isKnownModule(module) {
    return typeof module === "string" && state.moduleOrder.includes(module);
  }

  function isKnownSessionMode(mode) {
    return mode === "mock" || mode === "module-practice";
  }

  function getSessionStorageKey(mode) {
    return mode === "mock" ? MOCK_SESSION_STORAGE_KEY : PRACTICE_SESSION_STORAGE_KEY;
  }

  function getSessionByMode(mode) {
    if (mode === "mock") {
      return state.mockSession;
    }
    if (mode === "module-practice") {
      return state.practiceSession;
    }
    return null;
  }

  function setSessionByMode(mode, session) {
    if (mode === "mock") {
      state.mockSession = session;
      return;
    }
    if (mode === "module-practice") {
      state.practiceSession = session;
    }
  }

  function getActiveSession() {
    return getSessionByMode(state.activeSessionMode);
  }

  function titleFromModule(module) {
    return String(module || "")
      .replace(/^\d+_/, "")
      .split("_")
      .map((part) => (part ? part[0].toUpperCase() + part.slice(1) : part))
      .join(" ");
  }

  function loadSavedSession(mode) {
    const saved = loadJson(getSessionStorageKey(mode));
    const normalized = normalizeSession(saved, mode);
    return isValidSession(normalized, mode) ? normalized : null;
  }

  function normalizeSession(session, fallbackMode) {
    if (!session || typeof session !== "object") {
      return null;
    }

    return {
      ...session,
      version: session.version === 2 ? 2 : 1,
      mode: session.mode || fallbackMode,
      module: session.module || null,
      answers: session.answers && typeof session.answers === "object" ? session.answers : {},
      flagged: session.flagged && typeof session.flagged === "object" ? session.flagged : {},
      revealed: session.revealed && typeof session.revealed === "object" ? session.revealed : {},
    };
  }

  function isValidSession(session, expectedMode) {
    return Boolean(
      session &&
        (session.version === 1 || session.version === 2) &&
        session.mode === expectedMode &&
        Array.isArray(session.questions) &&
        typeof session.currentIndex === "number" &&
        session.startedAt &&
        (expectedMode === "mock" ? session.endsAt : true) &&
        (expectedMode === "module-practice" ? typeof session.module === "string" : true) &&
        session.startedAt &&
        session.answers &&
        session.flagged &&
        session.revealed
      );
  }

  function normalizeResult(result) {
    if (!result || typeof result !== "object") {
      return null;
    }

    return {
      ...result,
      mode: result.mode || "mock",
      module: result.module || null,
    };
  }

  function isValidResult(result) {
    return Boolean(
      result &&
        typeof result.id === "string" &&
        isKnownSessionMode(result.mode) &&
        Array.isArray(result.items) &&
        typeof result.score === "number" &&
        typeof result.total === "number" &&
        typeof result.completedAt === "number"
    );
  }

  function loadLastScore() {
    const saved = loadJson(SCORE_STORAGE_KEY);
    if (!saved || typeof saved !== "object") {
      return null;
    }
    return {
      ...saved,
      mode: saved.mode || "mock",
      module: saved.module || null,
    };
  }

  function resultDisplayName(result) {
    if (!result) {
      return "Attempt";
    }
    return result.mode === "module-practice" && result.module
      ? `${moduleLabel(result.module)} Practice`
      : "Timed Mock Test";
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
