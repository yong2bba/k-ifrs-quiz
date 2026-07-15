import "./style.css";
import { questions, topics } from "./questions.js";

const state = {
  topic: "전체",
  order: questions.map((question) => question.id),
  index: 0,
  answers: new Map(),
};

const app = document.querySelector("#app");

function filteredQuestions() {
  const ordered = state.order.map((id) => questions.find((question) => question.id === id));
  return state.topic === "전체" ? ordered : ordered.filter((question) => question.topic === state.topic);
}

function currentQuestion() {
  return filteredQuestions()[state.index];
}

function answeredInFilter() {
  return filteredQuestions().filter((question) => state.answers.has(question.id));
}

function scoreInFilter() {
  return answeredInFilter().filter((question) => state.answers.get(question.id).correct).length;
}

function render() {
  const active = filteredQuestions();
  const question = currentQuestion();
  const result = question ? state.answers.get(question.id) : null;
  const answered = answeredInFilter().length;
  const score = scoreInFilter();
  const progress = active.length ? Math.round((answered / active.length) * 100) : 0;

  app.innerHTML = `
    <div class="paper-grid" aria-hidden="true"></div>
    <header class="masthead">
      <a class="brand" href="#" aria-label="K-IFRS 판정실 처음으로">
        <span class="brand-mark">K</span>
        <span><strong>K-IFRS 판정실</strong><small>CASE LEDGER · 2026</small></span>
      </a>
      <div class="header-meta">
        <span>여행·항공 실무편</span>
        <span class="source-seal">공식 근거 연결</span>
      </div>
    </header>

    <main class="shell">
      <aside class="rail" aria-label="학습 현황과 주제 필터">
        <section class="score-card">
          <p class="eyebrow">CURRENT LEDGER</p>
          <div class="score-line"><strong>${score}</strong><span>/ ${answered || 0} 정답</span></div>
          <div class="progress-track" role="progressbar" aria-label="학습 진행률" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${progress}"><i style="width:${progress}%"></i></div>
          <p>${answered === 0 ? "첫 판단을 시작하세요." : `전체 ${active.length}문제 중 ${answered}문제 판정`}</p>
        </section>

        <nav class="topics" aria-label="주제 선택">
          <p class="eyebrow">STANDARD INDEX</p>
          ${["전체", ...topics].map((topic) => `
            <button class="topic-button ${state.topic === topic ? "is-active" : ""}" data-topic="${topic}">
              <span>${topic}</span><em>${topic === "전체" ? questions.length : questions.filter((item) => item.topic === topic).length}</em>
            </button>
          `).join("")}
        </nav>

        <button class="text-button" data-action="shuffle">문제 순서 섞기</button>
        <button class="text-button danger" data-action="reset">기록 초기화</button>
      </aside>

      <section class="quiz-stage" id="quiz" tabindex="-1">
        ${question ? renderQuestion(question, result, active) : renderEmpty()}
      </section>
    </main>

    <footer>
      <p>학습용 요약 · 실제 결산은 계약 원문, 중요성, 최신 기준서와 전문가 검토가 우선합니다.</p>
      <a href="https://www.kasb.or.kr/" target="_blank" rel="noreferrer">한국회계기준원 ↗</a>
    </footer>
    <div class="sr-only" aria-live="polite" id="announcer"></div>
  `;

  bindEvents();
}

function renderQuestion(question, result, active) {
  const position = state.index + 1;
  const selected = result?.selected;
  return `
    <article class="quiz-card ${result ? (result.correct ? "is-correct" : "is-wrong") : ""}">
      <div class="case-header">
        <div>
          <p class="case-number">CASE ${String(question.id).padStart(2, "0")} · ${position}/${active.length}</p>
          <h1>${question.title}</h1>
        </div>
        <span class="standard-chip">${question.standard}</span>
      </div>

      <p class="question-copy">${question.prompt}</p>

      <div class="options" role="group" aria-label="답 선택">
        ${question.options.map((option, index) => {
          const classes = ["answer-button"];
          if (result && index === question.correct) classes.push("is-answer");
          if (result && index === selected && index !== question.correct) classes.push("is-selected-wrong");
          return `<button class="${classes.join(" ")}" data-answer="${index}" ${result ? "disabled" : ""}>
            <span>${String.fromCharCode(65 + index)}</span><strong>${option}</strong>
          </button>`;
        }).join("")}
      </div>

      ${result ? renderVerdict(question, result) : `<p class="answer-hint">답을 선택하면 즉시 판정하고 근거를 공개합니다.</p>`}
    </article>

    <div class="pager">
      <button data-action="prev" ${state.index === 0 ? "disabled" : ""}>← 이전 문제</button>
      <span>${position} / ${active.length}</span>
      <button data-action="next" ${state.index >= active.length - 1 ? "disabled" : ""}>다음 문제 →</button>
    </div>
  `;
}

function renderVerdict(question, result) {
  return `
    <section class="verdict" aria-labelledby="verdict-title">
      <div class="verdict-banner">
        <span class="verdict-icon">${result.correct ? "✓" : "×"}</span>
        <div>
          <p>${result.correct ? "CORRECT" : "REVIEW"}</p>
          <h2 id="verdict-title">${result.correct ? "정답입니다" : "다시 볼 지점이 있어요"}</h2>
        </div>
      </div>
      <div class="answer-key">
        <p class="eyebrow">판정</p>
        <h3>${question.answer}</h3>
        <p>${question.explanation}</p>
        ${question.journal ? `<pre><code>${question.journal}</code></pre>` : ""}
      </div>
      <div class="evidence-panel">
        <div class="evidence-heading">
          <p class="eyebrow">AUTHORITY TRACE</p>
          <h3>정답의 공식 근거</h3>
        </div>
        <ol>
          ${question.references.map((reference) => `
            <li>
              <div><strong>${reference.standard}</strong><span>${reference.paragraphs}</span></div>
              <p>${reference.summary}</p>
              <div class="source-links">
                <a href="${reference.kasbUrl}" target="_blank" rel="noreferrer">K-IFRS 공식 목록 ↗</a>
                <a href="${reference.url}" target="_blank" rel="noreferrer">IFRS 공식 원문·자료 ↗</a>
              </div>
            </li>
          `).join("")}
        </ol>
        <p class="evidence-note">문단 번호는 K-IFRS와 대응 IFRS 기준서의 동일 번호를 병기했습니다. 링크는 공식 기관의 기준서·적용지원 페이지이며, 근거 확인일은 2026-07-15입니다.</p>
      </div>
    </section>
  `;
}

function renderEmpty() {
  return `<div class="empty"><h1>선택한 주제에 문제가 없습니다.</h1><button data-topic="전체">전체 문제 보기</button></div>`;
}

function bindEvents() {
  document.querySelectorAll("[data-topic]").forEach((button) => {
    button.addEventListener("click", () => {
      state.topic = button.dataset.topic;
      state.index = 0;
      render();
      document.querySelector("#quiz")?.focus();
    });
  });

  document.querySelectorAll("[data-answer]").forEach((button) => {
    button.addEventListener("click", () => {
      const question = currentQuestion();
      const selected = Number(button.dataset.answer);
      const correct = selected === question.correct;
      state.answers.set(question.id, { selected, correct });
      render();
      const announcer = document.querySelector("#announcer");
      announcer.textContent = correct ? "정답입니다. 근거가 공개되었습니다." : "오답입니다. 정답과 근거가 공개되었습니다.";
      document.querySelector(".verdict")?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  });

  document.querySelectorAll("[data-action]").forEach((button) => {
    button.addEventListener("click", () => {
      const action = button.dataset.action;
      const active = filteredQuestions();
      if (action === "next" && state.index < active.length - 1) state.index += 1;
      if (action === "prev" && state.index > 0) state.index -= 1;
      if (action === "reset") {
        state.answers.clear();
        state.index = 0;
      }
      if (action === "shuffle") {
        state.order = [...state.order].sort(() => Math.random() - 0.5);
        state.index = 0;
      }
      render();
      document.querySelector("#quiz")?.focus();
    });
  });
}

render();
