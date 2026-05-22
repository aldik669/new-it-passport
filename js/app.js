const PROGRESS_KEY = "kursor-passport-progress";

const state = {
  step: "welcome",
  parentName: "",
  parentPhone: "",
  childName: "",
  ageGroup: "",
  answers: [],
  questionIndex: 0,
  result: null
};

const screens = {
  welcome: "screen-welcome",
  registration: "screen-registration",
  questions: "screen-questions",
  result: "screen-result",
  admin: "screen-admin"
};

function saveProgress() {
  try {
    localStorage.setItem(PROGRESS_KEY, JSON.stringify({
      step: state.step,
      parentName: state.parentName,
      parentPhone: state.parentPhone,
      childName: state.childName,
      ageGroup: state.ageGroup,
      answers: state.answers,
      questionIndex: state.questionIndex,
      result: state.result
    }));
  } catch {}
}

function loadProgress() {
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (!raw) return false;
    const data = JSON.parse(raw);
    if (!data || !data.step) return false;
    state.step = data.step;
    state.parentName = data.parentName || "";
    state.parentPhone = data.parentPhone || "";
    state.childName = data.childName || "";
    state.ageGroup = data.ageGroup || "";
    state.answers = data.answers || [];
    state.questionIndex = data.questionIndex || 0;
    state.result = data.result || null;
    return true;
  } catch {
    return false;
  }
}

function clearProgress() {
  localStorage.removeItem(PROGRESS_KEY);
}

function showScreen(name) {
  state.step = name;
  Object.values(screens).forEach((id) => {
    document.getElementById(id).classList.toggle("screen--active", id === screens[name]);
  });
  window.scrollTo({ top: 0, behavior: "smooth" });
  saveProgress();
}

function normalizePhoneDigits(raw) {
  return String(raw || "").replace(/\D/g, "");
}

function parseParentPhone(raw) {
  let d = normalizePhoneDigits(raw);
  if (d.length === 0) return { ok: false, message: "Номер не корректный" };
  if (d.length === 11 && d[0] === "8") d = "7" + d.slice(1);
  if (d.length === 10) d = "7" + d;
  if (d.length < 11) return { ok: false, message: "Номер не корректный" };
  if (d.length > 11) return { ok: false, message: "Номер не корректный" };
  if (d[0] !== "7") return { ok: false, message: "Номер не корректный" };
  return { ok: true, value: "+" + d };
}

function formatAge(ag) {
  const map = { "5-7": "5–7 лет", "8-12": "8–12 лет", "13+": "13+ лет" };
  return map[ag] || ag;
}

function restoreRegistrationForm() {
  if (!state.parentName) return;
  const form = document.getElementById("registration-form");
  form.querySelector('[name="parentName"]').value = state.parentName;
  form.querySelector('[name="parentPhone"]').value = state.parentPhone;
  form.querySelector('[name="childName"]').value = state.childName;
  const ageInput = form.querySelector(`[name="ageGroup"][value="${state.ageGroup}"]`);
  if (ageInput) ageInput.checked = true;
}

function initRegistration() {
  const form = document.getElementById("registration-form");
  const err = document.getElementById("form-error");

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    err.hidden = true;

    const fd = new FormData(form);
    const parentName = String(fd.get("parentName") || "").trim();
    const parentPhoneRaw = String(fd.get("parentPhone") || "").trim();
    const childName = String(fd.get("childName") || "").trim();
    const ageGroup = fd.get("ageGroup");

    if (!parentName || !parentPhoneRaw || !childName || !ageGroup) {
      err.textContent = "Заполните все поля.";
      err.hidden = false;
      return;
    }

    const phoneParsed = parseParentPhone(parentPhoneRaw);
    if (!phoneParsed.ok) {
      err.textContent = phoneParsed.message;
      err.hidden = false;
      return;
    }

    state.parentName = parentName;
    state.parentPhone = phoneParsed.value;
    state.childName = childName;
    state.ageGroup = ageGroup;
    state.answers = [];
    state.questionIndex = 0;
    state.result = null;

    sendInitialLead({
      parentName: state.parentName,
      parentPhone: state.parentPhone,
      childName: state.childName
    });

    renderQuestion();
    showScreen("questions");
  });
}

function renderQuestion() {
  const q = PARENT_QUESTIONS[state.questionIndex];
  const total = PARENT_QUESTIONS.length;

  document.getElementById("question-progress").textContent = `Вопрос ${state.questionIndex + 1} из ${total}`;
  document.getElementById("question-progress-fill").style.width = `${((state.questionIndex + 1) / total) * 100}%`;
  document.getElementById("question-title").textContent = q.title;

  const answersEl = document.getElementById("answers");
  answersEl.innerHTML = "";
  const selected = state.answers[state.questionIndex];

  q.options.forEach((opt, i) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "answer-card";
    if (selected === i) btn.classList.add("answer-card--selected");
    btn.textContent = opt.label;

    btn.addEventListener("click", () => {
      state.answers[state.questionIndex] = i;
      renderQuestion();
      document.getElementById("question-next").disabled = false;
      saveProgress();
    });
    answersEl.appendChild(btn);
  });

  document.getElementById("question-next").disabled = selected === undefined;
}

async function finishAll() {
  state.result = computeResult(state.answers);
  const { scoreLevel, strengths, growthZones, totalScore } = state.result;

  saveLead({
    childName: state.childName,
    childAge: state.ageGroup,
    parentName: state.parentName,
    parentPhone: state.parentPhone,
    scoreLevel: scoreLevel.level,
    totalScore,
    direction: scoreLevel.direction,
    strengths,
    growthZones
  });

  renderResult();
  showScreen("result");

  const sent = await sendCompletedLead({
    parentName: state.parentName,
    parentPhone: state.parentPhone,
    childName: state.childName,
    profession: scoreLevel.direction
  });

  const statusEl = document.getElementById("save-status");
  if (statusEl) {
    statusEl.textContent = sent
      ? "Данные успешно сохранены"
      : "Результат сформирован, но возникла ошибка сохранения";
    statusEl.className = `save-status ${sent ? "save-status--ok" : "save-status--err"}`;
  }
}

function renderResult() {
  const { scoreLevel, strengths, growthZones, totalScore } = state.result;
  const open = document.getElementById("result-open");

  open.innerHTML = `
    <div class="result-card result-card--passport">
      <div class="passport-row">
        <div class="passport-item">
          <div class="passport-label">Ребенок</div>
          <div class="passport-value">${state.childName}</div>
        </div>
        <div class="passport-item">
          <div class="passport-label">Возраст</div>
          <div class="passport-value">${formatAge(state.ageGroup)}</div>
        </div>
      </div>
      <div class="passport-level">
        <div class="level-badge">${scoreLevel.level}</div>
      </div>
    </div>

    <div class="result-card result-card--desc">
      <p class="result-desc-text">${scoreLevel.description}</p>
    </div>

    <div class="result-card result-card--strengths">
      <h4>Что уже видим по ответам — сильные стороны</h4>
      <div class="tag-list tag-list--strength">
        ${strengths.map(s => `<span class="tag tag--strength">${s}</span>`).join("")}
      </div>
    </div>

    <div class="result-card result-card--growth">
      <h4>Зоны роста</h4>
      <div class="tag-list tag-list--growth">
        ${growthZones.map(s => `<span class="tag tag--growth">${s}</span>`).join("")}
      </div>
    </div>
  `;

  const blur = document.getElementById("blur-analytics");
  blur.innerHTML = `
    <div class="blur-block">
      <h5>Цифровой потенциал</h5>
      <div class="fake-bar"><span style="width:${Math.round((totalScore / 21) * 100)}%"></span></div>
      <p>Уровень: ████████</p>
    </div>
    <div class="blur-block">
      <h5>Логика</h5>
      <div class="fake-bar"><span style="width:65%"></span></div>
    </div>
    <div class="blur-block">
      <h5>Креатив</h5>
      <div class="fake-bar"><span style="width:72%"></span></div>
    </div>
    <div class="blur-block">
      <h5>Интерес к созданию</h5>
      <div class="fake-bar"><span style="width:80%"></span></div>
    </div>
    <div class="blur-block">
      <h5>Рекомендованное направление</h5>
      <p>████████████████</p>
    </div>
    <div class="blur-block">
      <h5>Подходящий курс</h5>
      <p>████████████</p>
    </div>
  `;
}

function resetAll() {
  clearProgress();
  clearLeadId();
  state.step = "welcome";
  state.parentName = "";
  state.parentPhone = "";
  state.childName = "";
  state.ageGroup = "";
  state.answers = [];
  state.questionIndex = 0;
  state.result = null;
  document.getElementById("registration-form").reset();
  showScreen("welcome");
}

function initNav() {
  document.querySelectorAll("[data-action='start']").forEach((el) => {
    el.addEventListener("click", () => showScreen("registration"));
  });
  document.querySelectorAll("[data-action='home']").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (location.hash) history.pushState("", document.title, window.location.pathname);
      resetAll();
    });
  });
  document.querySelectorAll("[data-action='restart']").forEach((el) => {
    el.addEventListener("click", resetAll);
  });

  document.getElementById("question-next").addEventListener("click", () => {
    if (state.questionIndex < PARENT_QUESTIONS.length - 1) {
      state.questionIndex++;
      renderQuestion();
      saveProgress();
    } else {
      finishAll();
    }
  });

  window.addEventListener("hashchange", () => {
    if (location.hash === "#admin") {
      document.querySelectorAll(".screen").forEach((s) => s.classList.remove("screen--active"));
      document.getElementById("screen-admin").classList.add("screen--active");
    }
  });
}

function restoreSession() {
  if (!loadProgress()) return;

  if (state.step === "registration") {
    restoreRegistrationForm();
    showScreen("registration");
    return;
  }
  if (state.step === "questions" && state.parentName) {
    restoreRegistrationForm();
    renderQuestion();
    showScreen("questions");
    return;
  }
  if (state.step === "result" && state.result) {
    renderResult();
    showScreen("result");
  }
}

document.addEventListener("DOMContentLoaded", () => {
  initRegistration();
  initNav();
  initAdmin();

  if (location.hash === "#admin") {
    document.querySelectorAll(".screen").forEach((s) => s.classList.remove("screen--active"));
    document.getElementById("screen-admin").classList.add("screen--active");
  } else {
    restoreSession();
  }
});
