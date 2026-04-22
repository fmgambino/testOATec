const APP_CONFIG = window.SUPERDB_CONFIG || {};
const ADMIN_USER = APP_CONFIG.adminUsername || "admin";
const ADMIN_EMAIL = APP_CONFIG.adminEmail || "admin@oatec.local";
const CONFIG_WANTS_SUPABASE = APP_CONFIG.mode === "superdb";
const HAS_VALID_SUPABASE_KEYS =
  !!APP_CONFIG.url &&
  !!APP_CONFIG.anonKey &&
  !String(APP_CONFIG.url).includes("TU-PROYECTO") &&
  !String(APP_CONFIG.anonKey).includes("TU_ANON_KEY");
const SUPABASE_ENABLED =
  CONFIG_WANTS_SUPABASE &&
  HAS_VALID_SUPABASE_KEYS &&
  !!window.supabase;
const supabaseClient = SUPABASE_ENABLED
  ? window.supabase.createClient(APP_CONFIG.url, APP_CONFIG.anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  : null;
let realtimeChannel = null;
const PASS_PERCENTAGE = 60;

const TXT_EXAMPLE = `TITULO: Simulacro OATec · Ambiente y ciudades
DESCRIPCION: Preguntas de ejemplo sobre ambiente, datos y ciudad inteligente.
AREA: Ambiente
DURACION: 18
CRONOMETRO: desc
ACTIVO: si
---
PREGUNTA: ¿Cuál es una fuente de energía renovable?
A: Petróleo
B: Carbón
C: Solar
D: Gas natural
CORRECTA: C
EXPLICACION: La energía solar proviene del sol y es renovable.
---
PREGUNTA: En una ciudad inteligente, los sensores sirven para:
A: Generar humo
B: Recolectar datos
C: Pintar edificios
D: Duplicar calles
CORRECTA: B
EXPLICACION: Los sensores recogen datos para mejorar decisiones.
`;

const defaultSeed = [
  {
    id: crypto.randomUUID(),
    title: "Simulacro OATec · Desafío espacial",
    description: "Prueba breve de ejemplo para entrenamiento inicial.",
    area: "Ciencias y lógica",
    time_limit_minutes: 20,
    timer_mode: "desc",
    is_active: true,
    created_at: new Date().toISOString(),
    questions: [
      {
        id: crypto.randomUUID(),
        prompt: "¿Qué planeta del sistema solar es conocido como el planeta rojo?",
        option_a: "Venus",
        option_b: "Marte",
        option_c: "Júpiter",
        option_d: "Mercurio",
        correct_option: "B",
        explanation: "Marte recibe ese nombre por el color rojizo de su superficie."
      },
      {
        id: crypto.randomUUID(),
        prompt: "Si un robot avanza 3 metros y luego 2 metros más, ¿cuánto recorrió en total?",
        option_a: "1 metro",
        option_b: "3 metros",
        option_c: "5 metros",
        option_d: "6 metros",
        correct_option: "C",
        explanation: "3 + 2 = 5."
      },
      {
        id: crypto.randomUUID(),
        prompt: "¿Qué sensor se usa normalmente para medir distancia en robótica educativa?",
        option_a: "Ultrasonido",
        option_b: "Termómetro",
        option_c: "Acelerómetro",
        option_d: "Barómetro",
        correct_option: "A",
        explanation: "El sensor ultrasónico es muy común para medir distancias."
      }
    ]
  },
  {
    id: crypto.randomUUID(),
    title: "Simulacro OATec · Ambiente y ciudades",
    description: "Preguntas ejemplo sobre ambiente, datos y ciudad inteligente.",
    area: "Ambiente",
    time_limit_minutes: 18,
    timer_mode: "desc",
    is_active: true,
    created_at: new Date().toISOString(),
    questions: [
      {
        id: crypto.randomUUID(),
        prompt: "¿Cuál es una fuente de energía renovable?",
        option_a: "Petróleo",
        option_b: "Carbón",
        option_c: "Solar",
        option_d: "Gas natural",
        correct_option: "C",
        explanation: "La energía solar proviene del sol y es renovable."
      },
      {
        id: crypto.randomUUID(),
        prompt: "En una ciudad inteligente, los sensores sirven para:",
        option_a: "Generar humo",
        option_b: "Recolectar datos",
        option_c: "Pintar edificios",
        option_d: "Duplicar calles",
        correct_option: "B",
        explanation: "Los sensores recogen datos para mejorar decisiones."
      }
    ]
  }
];

const views = {
  home: document.getElementById("homeView"),
  exam: document.getElementById("examView"),
  result: document.getElementById("resultView"),
  admin: document.getElementById("adminView")
};

const el = {
  activeTestsCount: document.getElementById("activeTestsCount"),
  attemptsCount: document.getElementById("attemptsCount"),
  bestScoreLabel: document.getElementById("bestScoreLabel"),
  testSelect: document.getElementById("testSelect"),
  selectedTestSummary: document.getElementById("selectedTestSummary"),
  rankingPreviewBody: document.getElementById("rankingPreviewBody"),
  participantForm: document.getElementById("participantForm"),
  firstName: document.getElementById("firstName"),
  lastName: document.getElementById("lastName"),
  dni: document.getElementById("dni"),
  age: document.getElementById("age"),
  course: document.getElementById("course"),
  division: document.getElementById("division"),
  examTitle: document.getElementById("examTitle"),
  examDescription: document.getElementById("examDescription"),
  questionsContainer: document.getElementById("questionsContainer"),
  timerLabel: document.getElementById("timerLabel"),
  timerModeLabel: document.getElementById("timerModeLabel"),
  answeredLabel: document.getElementById("answeredLabel"),
  correctLabel: document.getElementById("correctLabel"),
  resultSummary: document.getElementById("resultSummary"),
  adminLoginOverlay: document.getElementById("adminLoginOverlay"),
  adminLoginForm: document.getElementById("adminLoginForm"),
  adminUser: document.getElementById("adminUser"),
  adminPass: document.getElementById("adminPass"),
  adminTestsCount: document.getElementById("adminTestsCount"),
  adminQuestionsCount: document.getElementById("adminQuestionsCount"),
  adminAttemptsCount: document.getElementById("adminAttemptsCount"),
  adminAverageLabel: document.getElementById("adminAverageLabel"),
  createTestForm: document.getElementById("createTestForm"),
  testTitle: document.getElementById("testTitle"),
  testDescription: document.getElementById("testDescription"),
  testArea: document.getElementById("testArea"),
  testTimeLimit: document.getElementById("testTimeLimit"),
  testTimerMode: document.getElementById("testTimerMode"),
  testActive: document.getElementById("testActive"),
  questionsJson: document.getElementById("questionsJson"),
  txtImportInput: document.getElementById("txtImportInput"),
  downloadTxtExampleBtn: document.getElementById("downloadTxtExampleBtn"),
  adminTestsBody: document.getElementById("adminTestsBody"),
  adminRankingTestSelect: document.getElementById("adminRankingTestSelect"),
  adminRankingBody: document.getElementById("adminRankingBody"),
  adminAttemptsBody: document.getElementById("adminAttemptsBody"),
  adminStatusNote: document.getElementById("adminStatusNote"),
  toast: document.getElementById("toast")
};

const state = {
  tests: [],
  attempts: [],
  selectedTestId: null,
  currentTest: null,
  answers: {},
  startTime: null,
  timerId: null,
  adminAuthenticated: false,
  adminProfile: null,
  result: null
};

async function fetchAdminProfile() {
  if (!supabaseClient) return null;
  const { data: { session } } = await supabaseClient.auth.getSession();
  if (!session?.user?.id) return null;

  const { data, error } = await supabaseClient
    .from("admin_profiles")
    .select("user_id, username, role, is_active")
    .eq("user_id", session.user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (error) {
    console.error("No se pudo validar el perfil admin:", error);
    return null;
  }

  if (!data || data.role !== "admin") return null;
  return data;
}

async function refreshAdminSession() {
  if (!supabaseClient) {
    state.adminAuthenticated = false;
    state.adminProfile = null;
    return false;
  }

  const profile = await fetchAdminProfile();
  state.adminProfile = profile || null;
  state.adminAuthenticated = !!profile;
  return state.adminAuthenticated;
}

function getAdminStatusText() {
  if (SUPABASE_ENABLED) {
    if (state.adminAuthenticated && state.adminProfile) {
      return `SuperBase conectado · admin ${state.adminProfile.username}`;
    }
    return "SuperBase conectado · sesión pública";
  }
  if (CONFIG_WANTS_SUPABASE) {
    return "SuperBase sin configurar · completá db/config.js";
  }
  return "Modo local";
}

function scheduleRealtimeRefresh() {
  clearTimeout(scheduleRealtimeRefresh._id);
  scheduleRealtimeRefresh._id = setTimeout(async () => {
    await bootstrap(true);
    if (views.admin.classList.contains("active") && state.adminAuthenticated) {
      showView("admin");
    }
    showToast("Datos sincronizados en tiempo real.");
  }, 350);
}

function setupRealtime() {
  if (!supabaseClient) return;
  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
  }

  realtimeChannel = supabaseClient
    .channel("oatec-live")
    .on("postgres_changes", { event: "*", schema: "public", table: "tests" }, scheduleRealtimeRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, scheduleRealtimeRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "attempts" }, scheduleRealtimeRefresh)
    .subscribe();
}

async function loginAdminWithSupabase(username, password) {
  if (CONFIG_WANTS_SUPABASE && !supabaseClient) {
    throw new Error("Falta configurar db/config.js con la URL y la anon key de Supabase.");
  }

  if (!supabaseClient) {
    throw new Error("Este proyecto está configurado para modo local. Cambiá db/config.js a mode: 'superdb'.");
  }

  if (String(username || "").trim() !== ADMIN_USER) {
    throw new Error("El usuario administrador configurado es 'admin'.");
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password
  });

  if (error) throw error;

  const ok = await refreshAdminSession();
  if (!ok) {
    await supabaseClient.auth.signOut();
    throw new Error("La cuenta inició sesión pero no tiene rol admin en SuperBase.");
  }

  return true;
}

async function logoutAdminSession() {
  if (supabaseClient) {
    await supabaseClient.auth.signOut();
  }
  state.adminAuthenticated = false;
  state.adminProfile = null;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function showToast(message) {
  el.toast.textContent = message;
  el.toast.classList.remove("hidden");
  clearTimeout(showToast._id);
  showToast._id = setTimeout(() => el.toast.classList.add("hidden"), 2600);
}

function showView(name) {
  Object.values(views).forEach((node) => node.classList.remove("active"));
  views[name].classList.add("active");
}

function saveTheme() {
  localStorage.setItem("oatec-theme", document.body.classList.contains("light") ? "light" : "dark");
}

function loadTheme() {
  const saved = localStorage.getItem("oatec-theme");
  if (saved === "light") {
    document.body.classList.remove("dark");
    document.body.classList.add("light");
  } else {
    document.body.classList.remove("light");
    document.body.classList.add("dark");
  }
}

function saveLocalData(tests, attempts) {
  localStorage.setItem("oatec-tests", JSON.stringify(tests));
  localStorage.setItem("oatec-attempts", JSON.stringify(attempts));
}

function normalizeLoadedTests(tests) {
  return (tests || []).map((test) => ({
    ...test,
    timer_mode: test.timer_mode === "asc" ? "asc" : "desc",
    time_limit_minutes: Number(test.time_limit_minutes) || 20,
    questions: (test.questions || []).map((question) => ({
      id: question.id || crypto.randomUUID(),
      prompt: question.prompt || "",
      option_a: question.option_a || "",
      option_b: question.option_b || "",
      option_c: question.option_c || "",
      option_d: question.option_d || "",
      correct_option: String(question.correct_option || "").toUpperCase(),
      explanation: question.explanation || ""
    }))
  }));
}

function loadLocalData() {
  const tests = normalizeLoadedTests(JSON.parse(localStorage.getItem("oatec-tests") || "null") || defaultSeed);
  const attempts = JSON.parse(localStorage.getItem("oatec-attempts") || "[]");
  saveLocalData(tests, attempts);
  return { tests, attempts };
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("es-AR");
}

function formatSeconds(total) {
  const seconds = Math.max(0, Number(total) || 0);
  const mins = String(Math.floor(seconds / 60)).padStart(2, "0");
  const secs = String(seconds % 60).padStart(2, "0");
  return `${mins}:${secs}`;
}

function csvEscape(value) {
  return `"${String(value ?? "").replaceAll('"', '""')}"`;
}

function normalizeQuestionInput(q, index = 0) {
  const normalized = {
    id: q.id || crypto.randomUUID(),
    prompt: String(q.prompt || q.question || "").trim(),
    option_a: String(q.option_a || q.A || q.a || q.option1 || "").trim(),
    option_b: String(q.option_b || q.B || q.b || q.option2 || "").trim(),
    option_c: String(q.option_c || q.C || q.c || q.option3 || "").trim(),
    option_d: String(q.option_d || q.D || q.d || q.option4 || "").trim(),
    correct_option: String(q.correct_option || q.correcta || q.answer || "").trim().toUpperCase(),
    explanation: String(q.explanation || q.explicacion || q.explicación || "").trim(),
    position: Number(q.position) || index + 1
  };
  return normalized;
}

function getSelectedTest() {
  return state.tests.find((item) => item.id === el.testSelect.value) || null;
}

function getAttemptRankings(testId) {
  return state.attempts
    .filter((item) => item.test_id === testId)
    .sort((a, b) => {
      if (b.correct_answers !== a.correct_answers) return b.correct_answers - a.correct_answers;
      if (b.score_percentage !== a.score_percentage) return b.score_percentage - a.score_percentage;
      return a.duration_seconds - b.duration_seconds;
    });
}

function renderTopStats() {
  const activeTests = state.tests.filter((item) => item.is_active);
  el.activeTestsCount.textContent = activeTests.length;
  el.attemptsCount.textContent = state.attempts.length;
  const best = state.attempts.length ? Math.max(...state.attempts.map((item) => Number(item.score_percentage) || 0)) : 0;
  el.bestScoreLabel.textContent = `${Math.round(best)}%`;
}

function renderTestSelect() {
  const activeTests = state.tests.filter((item) => item.is_active);
  if (!activeTests.length) {
    el.testSelect.innerHTML = `<option value="">No hay tests activos</option>`;
    state.selectedTestId = null;
    updateSelectedTestSummary();
    return;
  }

  el.testSelect.innerHTML = activeTests
    .map((item) => `<option value="${item.id}">${escapeHtml(item.title)}</option>`)
    .join("");

  const stillExists = activeTests.some((item) => item.id === state.selectedTestId);
  state.selectedTestId = stillExists ? state.selectedTestId : activeTests[0].id;
  el.testSelect.value = state.selectedTestId;
  updateSelectedTestSummary();
}

function renderSummaryChip(label, value) {
  return `<div class="summary-chip"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`;
}

function updateSelectedTestSummary() {
  const test = getSelectedTest();
  if (!test) {
    el.selectedTestSummary.innerHTML = "No hay tests activos disponibles.";
    el.rankingPreviewBody.innerHTML = `<tr><td colspan="7">Sin datos</td></tr>`;
    return;
  }

  el.selectedTestSummary.innerHTML = `
    <div>
      <h4 class="summary-title">${escapeHtml(test.title)}</h4>
      <p class="summary-description">${escapeHtml(test.description || "Sin descripción.")}</p>
    </div>
    <div class="summary-meta">
      ${renderSummaryChip("Área", test.area || "General")}
      ${renderSummaryChip("Preguntas", String((test.questions || []).length))}
      ${renderSummaryChip("Tiempo", `${test.time_limit_minutes} min`)}
      ${renderSummaryChip("Cronómetro", test.timer_mode === "asc" ? "Ascendente" : "Descendente")}
    </div>
  `;

  renderRankingPreview(test.id);
}

function renderRankingPreview(testId) {
  const data = getAttemptRankings(testId).slice(0, 10);
  if (!data.length) {
    el.rankingPreviewBody.innerHTML = `<tr><td colspan="7">Todavía no hay resultados cargados para este test.</td></tr>`;
    return;
  }
  el.rankingPreviewBody.innerHTML = data.map((item, index) => `
    <tr>
      <td>${index + 1}</td>
      <td>${escapeHtml(item.last_name)}, ${escapeHtml(item.first_name)}</td>
      <td>${escapeHtml(item.course)} ${escapeHtml(item.division)}</td>
      <td>${item.correct_answers}/${item.total_questions}</td>
      <td>${Math.round(item.score_percentage)}%</td>
      <td>${formatSeconds(item.duration_seconds)}</td>
      <td>${formatDateTime(item.created_at)}</td>
    </tr>`).join("");
}

function validateParticipantForm() {
  if (!el.participantForm.reportValidity()) return null;
  return {
    first_name: el.firstName.value.trim(),
    last_name: el.lastName.value.trim(),
    dni: el.dni.value.trim(),
    age: Number(el.age.value),
    course: el.course.value.trim(),
    division: el.division.value.trim()
  };
}

function renderExam(test) {
  state.currentTest = JSON.parse(JSON.stringify(test));
  state.answers = {};
  state.startTime = Date.now();
  clearInterval(state.timerId);

  el.examTitle.textContent = test.title;
  el.examDescription.textContent = `${test.description || ""} · ${test.time_limit_minutes} minutos`;
  el.timerModeLabel.textContent = test.timer_mode === "asc" ? "Ascendente" : "Descendente";
  el.timerLabel.textContent = test.timer_mode === "desc" ? formatSeconds(Number(test.time_limit_minutes) * 60) : "00:00";

  el.questionsContainer.innerHTML = test.questions.map((question, index) => `
    <article class="card question-card" data-question-id="${question.id}">
      <span class="pill">Pregunta ${index + 1}</span>
      <h3>${escapeHtml(question.prompt)}</h3>
      <div class="options-grid">
        ${["A","B","C","D"].map((letter) => {
          const optionValue = question[`option_${letter.toLowerCase()}`] || "";
          return `<button class="secondary-btn option-btn" type="button" data-letter="${letter}">
            <strong>${letter}.</strong> ${escapeHtml(optionValue)}
          </button>`;
        }).join("")}
      </div>
      <div class="answer-note hidden"></div>
    </article>
  `).join("");

  bindQuestionButtons();
  updateExamStats();
  state.timerId = setInterval(updateTimer, 1000);
  showView("exam");
}

function updateTimer() {
  if (!state.startTime || !state.currentTest) return;
  const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
  const total = Number(state.currentTest.time_limit_minutes) * 60;

  if (state.currentTest.timer_mode === "asc") {
    el.timerLabel.textContent = formatSeconds(elapsed);
    if (elapsed >= total) finishExam();
    return;
  }

  const remaining = total - elapsed;
  el.timerLabel.textContent = formatSeconds(remaining);
  if (remaining <= 0) finishExam();
}

function bindQuestionButtons() {
  document.querySelectorAll(".option-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const card = button.closest("[data-question-id]");
      const qid = card.dataset.questionId;
      const question = state.currentTest.questions.find((item) => item.id === qid);
      state.answers[qid] = button.dataset.letter;

      card.querySelectorAll(".option-btn").forEach((node) => {
        node.classList.remove("selected");
        node.classList.remove("incorrect");
      });

      button.classList.add("selected");

      const note = card.querySelector(".answer-note");
      const isCorrect = button.dataset.letter === question.correct_option;
      note.classList.remove("hidden");
      note.textContent = isCorrect
        ? "Respuesta elegida correctamente."
        : `Respuesta elegida. Correcta: ${question.correct_option}. ${question.explanation || ""}`;

      card.querySelectorAll(".option-btn").forEach((node) => {
        if (node.dataset.letter === question.correct_option) node.classList.add("correct");
        if (node.dataset.letter === state.answers[qid] && state.answers[qid] !== question.correct_option) node.classList.add("incorrect");
      });

      updateExamStats();
    });
  });
}

function updateExamStats() {
  if (!state.currentTest) return;
  const answered = Object.keys(state.answers).length;
  let correct = 0;
  state.currentTest.questions.forEach((q) => {
    if (state.answers[q.id] === q.correct_option) correct += 1;
  });
  el.answeredLabel.textContent = answered;
  el.correctLabel.textContent = correct;
}

async function finishExam() {
  if (!state.currentTest) return;
  clearInterval(state.timerId);

  const participant = validateParticipantForm();
  if (!participant) {
    showToast("Completá primero los datos del participante.");
    showView("home");
    return;
  }

  const total = state.currentTest.questions.length;
  let correct = 0;
  state.currentTest.questions.forEach((q) => {
    if (state.answers[q.id] === q.correct_option) correct += 1;
  });

  const realDuration = Math.floor((Date.now() - state.startTime) / 1000);
  const maxDuration = Number(state.currentTest.time_limit_minutes) * 60;
  const duration = Math.min(realDuration, maxDuration);
  const percentage = total ? (correct / total) * 100 : 0;

  const payload = {
    id: crypto.randomUUID(),
    test_id: state.currentTest.id,
    test_title: state.currentTest.title,
    first_name: participant.first_name,
    last_name: participant.last_name,
    dni: participant.dni,
    age: participant.age,
    course: participant.course,
    division: participant.division,
    total_questions: total,
    correct_answers: correct,
    score_percentage: Number(percentage.toFixed(2)),
    duration_seconds: duration,
    timer_mode: state.currentTest.timer_mode,
    approved: percentage >= PASS_PERCENTAGE,
    created_at: new Date().toISOString()
  };

  await dataLayer.saveAttempt(payload);
  state.attempts.push(payload);
  state.result = payload;
  renderResult();
  renderTopStats();
  renderRankingPreview(state.currentTest.id);
  showView("result");
}

function renderResult() {
  const r = state.result;
  el.resultSummary.innerHTML = [
    ["Alumno", `${r.last_name}, ${r.first_name}`],
    ["Test", r.test_title],
    ["Puntaje", `${r.correct_answers}/${r.total_questions}`],
    ["Porcentaje", `${Math.round(r.score_percentage)}%`],
    ["Tiempo", formatSeconds(r.duration_seconds)],
    ["Curso", `${r.course} ${r.division}`],
    ["Cronómetro", r.timer_mode === "asc" ? "Ascendente" : "Descendente"],
    ["Estado", r.approved ? "Aprobado" : "En entrenamiento"]
  ].map(([label, value]) => `<div class="result-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
}

function exportAttemptsCsv() {
  const headers = ["fecha","test","apellido","nombre","dni","edad","curso","division","correctas","total","porcentaje","tiempo_segundos","cronometro","aprobado"];
  const rows = state.attempts.map((item) => [
    item.created_at, item.test_title, item.last_name, item.first_name, item.dni, item.age, item.course, item.division,
    item.correct_answers, item.total_questions, item.score_percentage, item.duration_seconds, item.timer_mode || "desc", item.approved ? "SI" : "NO"
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvEscape).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "ranking_oatec.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function parseBooleanText(value) {
  const normalized = String(value || "").trim().toLowerCase();
  return ["si", "sí", "true", "1", "activo", "activa"].includes(normalized);
}

function parseQuestionsTxt(text) {
  const normalized = text.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");
  const meta = {};
  const blocks = [];
  let currentQuestion = null;
  let inQuestions = false;

  function ensureQuestion() {
    if (!currentQuestion) currentQuestion = {};
    return currentQuestion;
  }

  lines.forEach((rawLine) => {
    const line = rawLine.trim();
    if (!line) return;

    if (line === "---") {
      if (inQuestions && currentQuestion && currentQuestion.prompt) blocks.push(currentQuestion);
      currentQuestion = null;
      inQuestions = true;
      return;
    }

    const parts = line.split(":");
    const key = parts.shift();
    const value = parts.join(":").trim();
    if (!key) return;
    const normalizedKey = key.trim().toUpperCase();

    if (!inQuestions && ["TITULO","DESCRIPCION","ÁREA","AREA","DURACION","DURACIÓN","CRONOMETRO","CRONÓMETRO","ACTIVO"].includes(normalizedKey)) {
      meta[normalizedKey] = value;
      return;
    }

    const question = ensureQuestion();
    if (normalizedKey === "PREGUNTA") question.prompt = value;
    if (normalizedKey === "A") question.option_a = value;
    if (normalizedKey === "B") question.option_b = value;
    if (normalizedKey === "C") question.option_c = value;
    if (normalizedKey === "D") question.option_d = value;
    if (normalizedKey === "CORRECTA") question.correct_option = String(value || "").trim().toUpperCase();
    if (normalizedKey === "EXPLICACION" || normalizedKey === "EXPLICACIÓN") question.explanation = value;
  });

  if (currentQuestion && currentQuestion.prompt) blocks.push(currentQuestion);

  const questions = blocks
    .map((q) => ({
      id: crypto.randomUUID(),
      prompt: q.prompt || "",
      option_a: q.option_a || "",
      option_b: q.option_b || "",
      option_c: q.option_c || "",
      option_d: q.option_d || "",
      correct_option: String(q.correct_option || "").toUpperCase(),
      explanation: q.explanation || ""
    }))
    .filter((q) =>
      q.prompt &&
      q.option_a &&
      q.option_b &&
      q.option_c &&
      q.option_d &&
      ["A", "B", "C", "D"].includes(q.correct_option)
    );

  return {
    title: meta.TITULO || "",
    description: meta.DESCRIPCION || "",
    area: meta["ÁREA"] || meta.AREA || "",
    time_limit_minutes: Number(meta.DURACION || meta["DURACIÓN"] || 20),
    timer_mode: String(meta.CRONOMETRO || meta["CRONÓMETRO"] || "desc").toLowerCase() === "asc" ? "asc" : "desc",
    is_active: parseBooleanText(meta.ACTIVO || "si"),
    questions
  };
}

function fillCreateFormFromTxt(parsed) {
  el.testTitle.value = parsed.title || "";
  el.testDescription.value = parsed.description || "";
  el.testArea.value = parsed.area || "";
  el.testTimeLimit.value = parsed.time_limit_minutes || 20;
  el.testTimerMode.value = parsed.timer_mode === "asc" ? "asc" : "desc";
  el.testActive.value = parsed.is_active ? "true" : "false";
  el.questionsJson.value = JSON.stringify(parsed.questions, null, 2);
}

function downloadExampleTxt() {
  const blob = new Blob([TXT_EXAMPLE], { type: "text/plain;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "modelo_test_oatec.txt";
  a.click();
  URL.revokeObjectURL(url);
}

async function renderAdmin() {
  el.adminTestsCount.textContent = state.tests.length;
  el.adminQuestionsCount.textContent = state.tests.reduce((acc, item) => acc + (item.questions || []).length, 0);
  el.adminAttemptsCount.textContent = state.attempts.length;
  const avg = state.attempts.length
    ? state.attempts.reduce((acc, item) => acc + Number(item.score_percentage || 0), 0) / state.attempts.length
    : 0;
  el.adminAverageLabel.textContent = `${Math.round(avg)}%`;
  el.adminStatusNote.textContent = getAdminStatusText();

  el.adminTestsBody.innerHTML = state.tests.map((item) => `
    <tr>
      <td>${escapeHtml(item.title)}</td>
      <td>${escapeHtml(item.area || "General")}</td>
      <td>${(item.questions || []).length}</td>
      <td>${item.timer_mode === "asc" ? "Asc." : "Desc."}</td>
      <td><span class="badge ${item.is_active ? "success" : "neutral"}">${item.is_active ? "Activo" : "Inactivo"}</span></td>
      <td><button class="danger-btn link-btn" data-delete-test="${item.id}" type="button">Eliminar</button></td>
    </tr>
  `).join("");

  document.querySelectorAll("[data-delete-test]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.deleteTest;
      if (!confirm("¿Eliminar test y sus resultados?")) return;
      await dataLayer.deleteTest(id);
      await bootstrap();
      if (state.adminAuthenticated) showView("admin");
      showToast("Test eliminado.");
    });
  });

  if (!state.tests.length) {
    el.adminRankingTestSelect.innerHTML = `<option value="">Sin tests</option>`;
    el.adminRankingBody.innerHTML = `<tr><td colspan="7">Sin resultados para este test.</td></tr>`;
  } else {
    el.adminRankingTestSelect.innerHTML = state.tests.map((item) => `<option value="${item.id}">${escapeHtml(item.title)}</option>`).join("");
    el.adminRankingTestSelect.value = state.tests[0]?.id || "";
    renderAdminRanking();
  }

  el.adminAttemptsBody.innerHTML = state.attempts.length
    ? state.attempts
        .slice()
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .map((item) => `
          <tr>
            <td>${formatDateTime(item.created_at)}</td>
            <td>${escapeHtml(item.last_name)}, ${escapeHtml(item.first_name)}</td>
            <td>${escapeHtml(item.test_title)}</td>
            <td>${item.correct_answers}/${item.total_questions}</td>
            <td>${Math.round(item.score_percentage)}%</td>
            <td><button class="danger-btn link-btn" data-delete-attempt="${item.id}" type="button">Eliminar</button></td>
          </tr>
        `).join("")
    : `<tr><td colspan="6">Todavía no hay intentos registrados.</td></tr>`;

  document.querySelectorAll("[data-delete-attempt]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("¿Eliminar intento?")) return;
      await dataLayer.deleteAttempt(btn.dataset.deleteAttempt);
      await bootstrap();
      if (state.adminAuthenticated) showView("admin");
      showToast("Intento eliminado.");
    });
  });
}

function renderAdminRanking() {
  const testId = el.adminRankingTestSelect.value;
  const data = getAttemptRankings(testId);
  el.adminRankingBody.innerHTML = data.length
    ? data.map((item, index) => `
      <tr>
        <td>${index + 1}</td>
        <td>${escapeHtml(item.last_name)}, ${escapeHtml(item.first_name)}</td>
        <td>${escapeHtml(item.course)} ${escapeHtml(item.division)}</td>
        <td>${item.correct_answers}/${item.total_questions}</td>
        <td>${Math.round(item.score_percentage)}%</td>
        <td>${formatSeconds(item.duration_seconds)}</td>
        <td>${formatDateTime(item.created_at)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="7">Sin resultados para este test.</td></tr>`;
}

const dataLayer = (() => {
  if (supabaseClient) {
    return {
      async loadAll() {
        const testsResponse = await supabaseClient
          .from("tests")
          .select("*")
          .order("created_at", { ascending: false });

        if (testsResponse.error) throw testsResponse.error;

        const questionsResponse = await supabaseClient
          .from("questions")
          .select("*")
          .order("position", { ascending: true });

        if (questionsResponse.error) throw questionsResponse.error;

        const attemptsSource = state.adminAuthenticated ? "attempts" : "v_public_attempts";
        const attemptsResponse = await supabaseClient
          .from(attemptsSource)
          .select("*")
          .order("created_at", { ascending: false });

        if (attemptsResponse.error) throw attemptsResponse.error;

        const merged = (testsResponse.data || []).map((test) => ({
          ...test,
          questions: (questionsResponse.data || []).filter((q) => q.test_id === test.id)
        }));

        return {
          tests: normalizeLoadedTests(merged),
          attempts: attemptsResponse.data || []
        };
      },
      async saveAttempt(payload) {
        const { error } = await supabaseClient.from("attempts").insert(payload);
        if (error) throw error;
      },
      async createTest(test, questions) {
        const { data: inserted, error } = await supabaseClient
          .from("tests")
          .insert(test)
          .select()
          .single();

        if (error) throw error;

        const withTest = questions.map((q, index) => ({
          ...q,
          test_id: inserted.id,
          position: index + 1
        }));

        if (withTest.length) {
          const { error: questionError } = await supabaseClient
            .from("questions")
            .insert(withTest);
          if (questionError) throw questionError;
        }
      },
      async deleteAttempt(id) {
        const { error } = await supabaseClient.from("attempts").delete().eq("id", id);
        if (error) throw error;
      },
      async deleteTest(id) {
        const { error } = await supabaseClient.from("tests").delete().eq("id", id);
        if (error) throw error;
      }
    };
  }

  return {
    async loadAll() { return loadLocalData(); },
    async saveAttempt(payload) {
      const local = loadLocalData();
      local.attempts.push(payload);
      saveLocalData(local.tests, local.attempts);
    },
    async createTest(test, questions) {
      const local = loadLocalData();
      local.tests.unshift({
        ...test,
        id: crypto.randomUUID(),
        created_at: new Date().toISOString(),
        questions
      });
      saveLocalData(local.tests, local.attempts);
    },
    async deleteAttempt(id) {
      const local = loadLocalData();
      const attempts = local.attempts.filter((item) => item.id !== id);
      saveLocalData(local.tests, attempts);
    },
    async deleteTest(id) {
      const local = loadLocalData();
      const tests = local.tests.filter((item) => item.id !== id);
      const attempts = local.attempts.filter((item) => item.test_id !== id);
      saveLocalData(tests, attempts);
    }
  };
})();

async function bootstrap(preserveView = false) {
  try {
    await refreshAdminSession();
    const all = await dataLayer.loadAll();
    state.tests = normalizeLoadedTests(all.tests || []);
    state.attempts = all.attempts || [];
    renderTopStats();
    renderTestSelect();
    await renderAdmin();
    if (!preserveView && state.adminAuthenticated && views.admin.classList.contains("active")) {
      showView("admin");
    }
  } catch (error) {
    console.error(error);
    el.adminStatusNote.textContent = CONFIG_WANTS_SUPABASE ? "Error de conexión" : "Modo local";
    showToast(error?.message || "No se pudieron sincronizar los datos con SuperBase.");
  }
}

function bindEvents() {
  document.getElementById("themeToggle").addEventListener("click", () => {
    document.body.classList.toggle("light");
    document.body.classList.toggle("dark");
    saveTheme();
  });

  document.getElementById("goHomeBtn").addEventListener("click", () => showView("home"));

  document.getElementById("showRankingBtn").addEventListener("click", () => {
    showView("home");
    renderRankingPreview(el.testSelect.value);
  });

  document.getElementById("refreshRankingBtn").addEventListener("click", async () => {
    await bootstrap();
    renderRankingPreview(el.testSelect.value);
    showToast("Ranking actualizado.");
  });

  el.testSelect.addEventListener("change", () => {
    state.selectedTestId = el.testSelect.value;
    updateSelectedTestSummary();
  });

  document.getElementById("startSelectedTestBtn").addEventListener("click", () => {
    const participant = validateParticipantForm();
    if (!participant) return showToast("Completá los datos del alumno antes de comenzar.");
    const test = getSelectedTest();
    if (!test) return showToast("No hay test seleccionado.");
    renderExam(test);
  });

  document.getElementById("finishTestBtn").addEventListener("click", finishExam);

  document.getElementById("cancelTestBtn").addEventListener("click", () => {
    clearInterval(state.timerId);
    showView("home");
  });

  document.getElementById("newAttemptBtn").addEventListener("click", () => showView("home"));

  document.getElementById("backToRankingBtn").addEventListener("click", () => {
    showView("home");
    renderRankingPreview(state.result?.test_id || el.testSelect.value);
  });

  document.getElementById("openAdminBtn").addEventListener("click", async () => {
    await refreshAdminSession();
    if (state.adminAuthenticated) {
      await bootstrap(true);
      showView("admin");
      return;
    }
    el.adminLoginOverlay.classList.remove("hidden");
  });
  document.getElementById("closeAdminLoginBtn").addEventListener("click", () => el.adminLoginOverlay.classList.add("hidden"));

el.adminLoginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  try {
    await loginAdminWithSupabase(el.adminUser.value.trim(), el.adminPass.value);
    el.adminLoginOverlay.classList.add("hidden");
    el.adminPass.value = "";
    await bootstrap(true);
    showView("admin");
    showToast("Sesión admin iniciada.");
  } catch (error) {
    console.error(error);
    showToast(error.message || "Credenciales inválidas.");
  }
});

document.getElementById("adminLogoutBtn").addEventListener("click", async () => {
  await logoutAdminSession();
  await bootstrap(true);
  showView("home");
  showToast("Sesión cerrada.");
});

  document.getElementById("adminRefreshBtn").addEventListener("click", async () => {
    await bootstrap();
    showView("admin");
    showToast("Panel actualizado.");
  });

  document.getElementById("exportAttemptsBtn").addEventListener("click", exportAttemptsCsv);
  el.adminRankingTestSelect.addEventListener("change", renderAdminRanking);

  el.downloadTxtExampleBtn.addEventListener("click", downloadExampleTxt);

  el.txtImportInput.addEventListener("change", async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const content = await file.text();
      const parsed = parseQuestionsTxt(content);
      if (!parsed.questions.length) {
        showToast("El TXT no contiene preguntas válidas.");
        return;
      }
      fillCreateFormFromTxt(parsed);
      showToast(`TXT importado. Se cargaron ${parsed.questions.length} preguntas.`);
    } catch (error) {
      console.error(error);
      showToast("No se pudo leer el TXT.");
    }
  });

  el.createTestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    try {
      const parsed = JSON.parse(el.questionsJson.value || "[]");
      const questions = parsed.map((q, index) => normalizeQuestionInput(q, index)).filter((q) =>
        q.prompt &&
        q.option_a &&
        q.option_b &&
        q.option_c &&
        q.option_d &&
        ["A", "B", "C", "D"].includes(q.correct_option)
      );

      if (!questions.length) throw new Error("No hay preguntas válidas.");
      if (!el.testTitle.value.trim()) throw new Error("El título es obligatorio.");

      const test = {
        title: el.testTitle.value.trim(),
        description: el.testDescription.value.trim(),
        area: el.testArea.value.trim(),
        time_limit_minutes: Math.max(1, Number(el.testTimeLimit.value) || 25),
        timer_mode: el.testTimerMode.value === "asc" ? "asc" : "desc",
        is_active: el.testActive.value === "true"
      };

      await dataLayer.createTest(test, questions);
      el.createTestForm.reset();
      el.questionsJson.value = "";
      el.testTimerMode.value = "desc";
      el.testActive.value = "true";
      el.txtImportInput.value = "";
      await bootstrap();
      showView("admin");
      showToast("Test creado correctamente.");
    } catch (error) {
      console.error(error);
      showToast(error.message || "No se pudo crear el test. Revisá el contenido.");
    }
  });
}

loadTheme();
bindEvents();
bootstrap();
if (supabaseClient) {
  supabaseClient.auth.onAuthStateChange(async () => {
    await refreshAdminSession();
    await bootstrap(true);
  });
  setupRealtime();
}
