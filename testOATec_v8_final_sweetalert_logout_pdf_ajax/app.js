const APP_CONFIG = window.SUPERDB_CONFIG || {};
const ADMIN_USER = APP_CONFIG.adminUsername || "fernando.m.gambino@gmail.com";
const ADMIN_EMAIL = APP_CONFIG.adminEmail || "fernando.m.gambino@gmail.com";
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
  saveProgressOverlay: document.getElementById("saveProgressOverlay"),
  saveProgressTitle: document.getElementById("saveProgressTitle"),
  saveProgressText: document.getElementById("saveProgressText"),
  saveProgressBar: document.getElementById("saveProgressBar"),
  saveProgressPercent: document.getElementById("saveProgressPercent"),
  saveProgressCounter: document.getElementById("saveProgressCounter"),
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
  result: null,
  examLocked: false,
  examSessionToken: null,
  serverTimeOffsetMs: 0,
  antiCheatWarnings: 0,
  antiCheatMaxWarnings: 2,
  antiCheatTriggered: false
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
      return `Supabase conectado · admin ${state.adminProfile.username}`;
    }
    return "Supabase conectado · sesión pública";
  }
  if (CONFIG_WANTS_SUPABASE) {
    return "Supabase sin configurar · completá db/config.js";
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
  }, 120);
}

function setupRealtime() {
  if (!supabaseClient) return;
  if (realtimeChannel) {
    supabaseClient.removeChannel(realtimeChannel);
  }

  realtimeChannel = supabaseClient
    .channel("oatec-live", { config: { broadcast: { self: false }, presence: { key: "oatec" } } })
    .on("postgres_changes", { event: "*", schema: "public", table: "tests" }, scheduleRealtimeRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, scheduleRealtimeRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "attempts" }, scheduleRealtimeRefresh)
    .subscribe((status, err) => {
      console.info("Supabase Realtime:", status, err || "");
      if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
        el.adminStatusNote.textContent = "Realtime desconectado · reintentando";
        clearTimeout(setupRealtime._retryId);
        setupRealtime._retryId = setTimeout(setupRealtime, 3000);
      }
      if (status === "SUBSCRIBED") {
        el.adminStatusNote.textContent = getAdminStatusText() + " · Realtime activo";
      }
    });
}

async function loginAdminWithSupabase(username, password) {
  if (CONFIG_WANTS_SUPABASE && !supabaseClient) {
    throw new Error("Falta configurar db/config.js con la URL y la anon key de Supabase.");
  }

  if (!supabaseClient) {
    throw new Error("Este proyecto está configurado para modo local. Cambiá db/config.js a mode: 'superdb'.");
  }

  const inputUser = String(username || "").trim().toLowerCase();
  const allowedUsers = [
    String(ADMIN_USER || "").trim().toLowerCase(),
    String(ADMIN_EMAIL || "").trim().toLowerCase(),
    "fmgambino",
    "fernando.m.gambino@gmail.com"
  ].filter(Boolean);

  if (!allowedUsers.includes(inputUser)) {
    throw new Error(`Usuario admin inválido. Usá ${ADMIN_EMAIL} o ${ADMIN_USER}.`);
  }

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password
  });

  if (error) {
    throw new Error("Credenciales inválidas en Supabase Auth. Verificá que exista el usuario fernando.m.gambino@gmail.com y que la contraseña sea correcta.");
  }

  const ok = await refreshAdminSession();
  if (!ok) {
    await supabaseClient.auth.signOut();
    throw new Error("La cuenta inició sesión pero no tiene perfil admin. Ejecutá el SQL corregido después de crear el usuario en Authentication.");
  }

  return true;
}

async function logoutAdminSession() {
  if (realtimeChannel && supabaseClient) {
    try { await supabaseClient.removeChannel(realtimeChannel); } catch (_) {}
    realtimeChannel = null;
  }

  if (supabaseClient) {
    const signOutPromise = supabaseClient.auth.signOut({ scope: "local" });
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error("Tiempo de espera agotado al cerrar sesión. Revisá la conexión y probá nuevamente.")), 8000)
    );
    const { error } = await Promise.race([signOutPromise, timeoutPromise]);
    if (error) throw new Error(getSupabaseErrorMessage(error));
  }

  try {
    localStorage.removeItem("sb-" + String(APP_CONFIG.url || "").split("//")[1]?.split(".")[0] + "-auth-token");
  } catch (_) {}

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

function hasSweetAlert() {
  return typeof window.Swal !== "undefined";
}

function getSwalThemeOptions() {
  return {
    background: document.body.classList.contains("light") ? "#ffffff" : "#0f1b35",
    color: document.body.classList.contains("light") ? "#13203d" : "#eef2fb",
    confirmButtonColor: "#6f7cff",
    cancelButtonColor: "#64748b",
    denyButtonColor: "#0ea5e9",
    scrollbarPadding: false
  };
}

async function showAlert({ icon = "info", title = "", text = "", html = "", confirmButtonText = "Aceptar" }) {
  if (hasSweetAlert()) {
    return window.Swal.fire({
      icon,
      title,
      text,
      html,
      confirmButtonText,
      ...getSwalThemeOptions()
    });
  }
  showToast(text || title || "Operación completada.");
  return Promise.resolve({ isConfirmed: true });
}

async function showConfirm({ icon = "question", title = "", text = "", html = "", confirmButtonText = "Aceptar", cancelButtonText = "Cancelar", danger = false }) {
  if (hasSweetAlert()) {
    return window.Swal.fire({
      icon,
      title,
      text,
      html,
      showCancelButton: true,
      reverseButtons: true,
      confirmButtonText,
      cancelButtonText,
      ...getSwalThemeOptions(),
      confirmButtonColor: danger ? "#ef4444" : "#6f7cff",
      cancelButtonColor: "#64748b"
    });
  }
  return Promise.resolve({ isConfirmed: window.confirm(text || title || "¿Confirmar acción?") });
}



function clampProgress(value) {
  return Math.max(0, Math.min(100, Math.round(Number(value) || 0)));
}

function openSaveProgress(totalQuestions = 0) {
  if (!el.saveProgressOverlay) return;
  el.saveProgressOverlay.classList.remove("hidden");
  updateSaveProgress({
    percent: 0,
    uploaded: 0,
    total: totalQuestions,
    text: "Preparando el test y validando preguntas..."
  });
}

function updateSaveProgress({ percent = 0, uploaded = 0, total = 0, text = "" } = {}) {
  if (!el.saveProgressOverlay) return;
  const safePercent = clampProgress(percent);
  if (el.saveProgressBar) el.saveProgressBar.style.width = `${safePercent}%`;
  if (el.saveProgressPercent) el.saveProgressPercent.textContent = `${safePercent}%`;
  if (el.saveProgressCounter) el.saveProgressCounter.textContent = `${uploaded}/${total} preguntas`;
  if (el.saveProgressText && text) el.saveProgressText.textContent = text;
}

function closeSaveProgress() {
  if (!el.saveProgressOverlay) return;
  el.saveProgressOverlay.classList.add("hidden");
}

function getSupabaseErrorMessage(error) {
  if (!error) return "Error desconocido de Supabase.";
  const parts = [
    error.message,
    error.details ? `Detalles: ${error.details}` : "",
    error.hint ? `Sugerencia: ${error.hint}` : "",
    error.code ? `Código: ${error.code}` : ""
  ].filter(Boolean);
  return parts.join("\n");
}

function stripGeneratedQuestionFields(question) {
  return {
    prompt: String(question.prompt || "").trim(),
    option_a: String(question.option_a || "").trim(),
    option_b: String(question.option_b || "").trim(),
    option_c: String(question.option_c || "").trim(),
    option_d: String(question.option_d || "").trim(),
    correct_option: String(question.correct_option || "").trim().toUpperCase(),
    explanation: String(question.explanation || "").trim()
  };
}

function stripGeneratedTestFields(test) {
  return {
    title: String(test.title || "").trim(),
    description: String(test.description || "").trim(),
    area: String(test.area || "").trim(),
    time_limit_minutes: Math.max(1, Number(test.time_limit_minutes) || 25),
    timer_mode: test.timer_mode === "asc" ? "asc" : "desc",
    is_active: Boolean(test.is_active)
  };
}

function buildTop10RankingHtml(testId, highlightAttemptId = null) {
  const fullRanking = getAttemptRankings(testId);
  const ranking = fullRanking.slice(0, 10);
  const myPosition = fullRanking.findIndex((item) => item.id === highlightAttemptId) + 1;

  if (!ranking.length) {
    return `<p style="margin:0;color:#9ea8c0;">Todavía no hay resultados cargados para este test.</p>`;
  }

  const rows = ranking.map((item, index) => {
    const isMine = item.id === highlightAttemptId;
    const name = `${escapeHtml(item.last_name)}, ${escapeHtml(item.first_name)}`;
    const rowStyle = isMine ? ' style="background: rgba(111,124,255,.16); font-weight:700;"' : "";
    return `
      <tr${rowStyle}>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(158,168,192,.18);">${index + 1}</td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(158,168,192,.18);">${name}</td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(158,168,192,.18);">${escapeHtml(item.course)} ${escapeHtml(item.division)}</td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(158,168,192,.18);">${item.correct_answers}/${item.total_questions}</td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(158,168,192,.18);">${Math.round(item.score_percentage)}%</td>
        <td style="padding:8px 10px;border-bottom:1px solid rgba(158,168,192,.18);">${formatSeconds(item.duration_seconds)}</td>
      </tr>`;
  }).join("");

  return `
    <div style="text-align:left">
      <div style="margin-bottom:12px;padding:12px 14px;border-radius:14px;background:rgba(111,124,255,.12);">
        <strong>Tu ranking es:</strong> ${myPosition > 0 ? myPosition : "-"}
      </div>
      <div style="max-height:320px;overflow:auto;border:1px solid rgba(158,168,192,.18);border-radius:14px;">
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <thead>
            <tr>
              <th style="padding:8px 10px;text-align:left;">#</th>
              <th style="padding:8px 10px;text-align:left;">Alumno</th>
              <th style="padding:8px 10px;text-align:left;">Curso</th>
              <th style="padding:8px 10px;text-align:left;">Puntaje</th>
              <th style="padding:8px 10px;text-align:left;">%</th>
              <th style="padding:8px 10px;text-align:left;">Tiempo</th>
            </tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </div>
    </div>`;
}

function shuffleArray(items) {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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


function nowMs() {
  return Date.now() + (Number(state.serverTimeOffsetMs) || 0);
}

async function syncServerTime() {
  if (!SUPABASE_ENABLED) {
    state.serverTimeOffsetMs = 0;
    return 0;
  }

  const candidates = [
    `${APP_CONFIG.url}/auth/v1/settings`,
    `${APP_CONFIG.url}/rest/v1/`
  ];

  for (const endpoint of candidates) {
    try {
      const response = await fetch(endpoint, {
        method: "GET",
        headers: {
          apikey: APP_CONFIG.anonKey,
          Authorization: `Bearer ${APP_CONFIG.anonKey}`
        }
      });
      const serverDateHeader = response.headers.get("date");
      if (serverDateHeader) {
        const offset = new Date(serverDateHeader).getTime() - Date.now();
        state.serverTimeOffsetMs = Number.isFinite(offset) ? offset : 0;
        return state.serverTimeOffsetMs;
      }
    } catch (error) {
      console.warn("No se pudo sincronizar hora del servidor:", error);
    }
  }

  state.serverTimeOffsetMs = 0;
  return 0;
}

function lockAnsweredQuestion(card) {
  card.classList.add("locked");
  card.querySelectorAll(".option-btn").forEach((node) => {
    node.disabled = true;
    node.classList.add("locked-option");
  });
}

function buildShuffledQuestion(question) {
  const options = [
    { original: "A", text: question.option_a || "" },
    { original: "B", text: question.option_b || "" },
    { original: "C", text: question.option_c || "" },
    { original: "D", text: question.option_d || "" }
  ];

  const shuffled = shuffleArray(options.map((item) => ({ ...item })));
  const byIndexLetter = ["A", "B", "C", "D"];

  return {
    ...JSON.parse(JSON.stringify(question)),
    shuffled_options: shuffled.map((item, index) => ({
      displayLetter: byIndexLetter[index],
      originalLetter: item.original,
      text: item.text
    }))
  };
}

function getQuestionById(questionId) {
  return state.currentTest?.questions?.find((item) => item.id === questionId) || null;
}

function getAnsweredCount() {
  return Object.keys(state.answers).length;
}

function getCorrectCount() {
  if (!state.currentTest) return 0;
  let correct = 0;
  state.currentTest.questions.forEach((q) => {
    const selected = state.answers[q.id];
    if (selected && selected === q.correct_option) correct += 1;
  });
  return correct;
}

async function registerAntiCheatEvent(reason) {
  if (!state.currentTest || state.antiCheatTriggered) return;

  state.antiCheatWarnings += 1;
  const remaining = Math.max(state.antiCheatMaxWarnings - state.antiCheatWarnings, 0);

  if (state.antiCheatWarnings >= state.antiCheatMaxWarnings) {
    state.antiCheatTriggered = true;
    await showAlert({
      icon: "warning",
      title: "Modo examen activado",
      html: `<p>Se detectó una salida de foco durante la evaluación.</p>
             <p><strong>El intento se enviará automáticamente.</strong></p>
             <p style="margin-top:8px;color:#9ea8c0;">Motivo detectado: ${escapeHtml(reason)}</p>`,
      confirmButtonText: "Entendido"
    });
    await finishExam({ forced: true, reason });
    return;
  }

  await showAlert({
    icon: "warning",
    title: "Atención",
    html: `<p>No cambies de pestaña ni minimices la ventana durante el examen.</p>
           <p>Advertencias usadas: <strong>${state.antiCheatWarnings}/${state.antiCheatMaxWarnings}</strong></p>
           <p>Advertencias restantes: <strong>${remaining}</strong></p>
           <p style="margin-top:8px;color:#9ea8c0;">Motivo detectado: ${escapeHtml(reason)}</p>`,
    confirmButtonText: "Continuar"
  });
}

function examKeydownGuard(event) {
  if (!views.exam.classList.contains("active") || !state.currentTest) return;

  const key = String(event.key || "").toLowerCase();
  const blocked =
    key === "f12" ||
    (event.ctrlKey && ["u", "c", "x", "v", "p", "s"].includes(key)) ||
    (event.ctrlKey && event.shiftKey && ["i", "j", "c"].includes(key));

  if (blocked) {
    event.preventDefault();
    event.stopPropagation();
    registerAntiCheatEvent(`Atajo bloqueado: ${escapeHtml(event.key || "tecla")}`);
  }
}

function examVisibilityGuard() {
  if (document.hidden && views.exam.classList.contains("active") && state.currentTest) {
    registerAntiCheatEvent("Cambio de pestaña o ventana");
  }
}

function examBlurGuard() {
  if (views.exam.classList.contains("active") && state.currentTest) {
    registerAntiCheatEvent("La ventana perdió el foco");
  }
}

function examContextMenuGuard(event) {
  if (views.exam.classList.contains("active") && state.currentTest) {
    event.preventDefault();
    registerAntiCheatEvent("Click derecho bloqueado");
  }
}

async function prepareExamSession() {
  await syncServerTime();
  state.answers = {};
  state.startTime = nowMs();
  state.examLocked = false;
  state.examSessionToken = crypto.randomUUID();
  state.antiCheatWarnings = 0;
  state.antiCheatTriggered = false;
  clearInterval(state.timerId);
}

function renderExam(test) {
  const shuffledQuestions = shuffleArray((test.questions || []).map((question) => buildShuffledQuestion(question)));
  state.currentTest = {
    ...JSON.parse(JSON.stringify(test)),
    questions: shuffledQuestions
  };

  prepareExamSession().then(() => {
    el.examTitle.textContent = test.title;
    el.examDescription.textContent = `${test.description || ""} · ${test.time_limit_minutes} minutos · preguntas y respuestas aleatorias por alumno`;
    el.timerModeLabel.textContent = test.timer_mode === "asc" ? "Ascendente" : "Descendente";
    el.timerLabel.textContent = test.timer_mode === "desc" ? formatSeconds(Number(test.time_limit_minutes) * 60) : "00:00";

    el.questionsContainer.innerHTML = state.currentTest.questions.map((question, index) => `
      <article class="card question-card enter-anim" data-question-id="${question.id}">
        <span class="pill">Pregunta ${index + 1}</span>
        <h3>${escapeHtml(question.prompt)}</h3>
        <div class="options-grid">
          ${(question.shuffled_options || []).map((option) => `
            <button class="secondary-btn option-btn" type="button" data-display-letter="${option.displayLetter}" data-original-letter="${option.originalLetter}">
              <strong>${option.displayLetter}.</strong> ${escapeHtml(option.text)}
            </button>
          `).join("")}
        </div>
        <div class="answer-note hidden"></div>
      </article>
    `).join("");

    bindQuestionButtons();
    updateExamStats();
    state.timerId = setInterval(updateTimer, 1000);
    showView("exam");
  });
}

function updateTimer() {
  if (!state.startTime || !state.currentTest) return;
  const elapsed = Math.floor((nowMs() - state.startTime) / 1000);
  const total = Number(state.currentTest.time_limit_minutes) * 60;

  if (state.currentTest.timer_mode === "asc") {
    el.timerLabel.textContent = formatSeconds(elapsed);
    if (elapsed >= total) finishExam({ forced: true, reason: "Tiempo agotado" });
    return;
  }

  const remaining = total - elapsed;
  el.timerLabel.textContent = formatSeconds(Math.max(remaining, 0));
  if (remaining <= 0) finishExam({ forced: true, reason: "Tiempo agotado" });
}

function bindQuestionButtons() {
  document.querySelectorAll(".option-btn").forEach((button) => {
    button.addEventListener("click", async () => {
      const card = button.closest("[data-question-id]");
      const qid = card.dataset.questionId;
      const question = getQuestionById(qid);
      if (!question || state.examLocked) return;

      if (state.answers[qid]) {
        await showAlert({
          icon: "info",
          title: "Respuesta bloqueada",
          text: "En modo competencia no se puede cambiar una respuesta una vez elegida."
        });
        return;
      }

      const selectedOriginal = button.dataset.originalLetter;
      state.answers[qid] = selectedOriginal;

      card.querySelectorAll(".option-btn").forEach((node) => {
        node.classList.remove("selected", "incorrect", "correct");
      });

      button.classList.add("selected");

      const note = card.querySelector(".answer-note");
      const isCorrect = selectedOriginal === question.correct_option;
      note.classList.remove("hidden");
      note.textContent = isCorrect
        ? "Respuesta elegida correctamente. Quedó bloqueada para este intento."
        : `Respuesta registrada. Correcta: ${question.correct_option}. ${question.explanation || ""}`;

      card.querySelectorAll(".option-btn").forEach((node) => {
        if (node.dataset.originalLetter === question.correct_option) node.classList.add("correct");
        if (node.dataset.originalLetter === selectedOriginal && selectedOriginal !== question.correct_option) node.classList.add("incorrect");
      });

      lockAnsweredQuestion(card);
      updateExamStats();
    });
  });
}

function updateExamStats() {
  if (!state.currentTest) return;
  const answered = getAnsweredCount();
  const correct = getCorrectCount();
  el.answeredLabel.textContent = answered;
  el.correctLabel.textContent = correct;
}

async function finishExam(options = {}) {
  if (!state.currentTest || state.examLocked) return;
  state.examLocked = true;
  clearInterval(state.timerId);

  const participant = validateParticipantForm();
  if (!participant) {
    showToast("Completá primero los datos del participante.");
    state.examLocked = false;
    showView("home");
    return;
  }

  const total = state.currentTest.questions.length;
  const correct = getCorrectCount();
  const realDuration = Math.floor((nowMs() - state.startTime) / 1000);
  const maxDuration = Number(state.currentTest.time_limit_minutes) * 60;
  const duration = Math.min(Math.max(realDuration, 0), maxDuration);
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
    created_at: new Date(nowMs()).toISOString()
  };

  try {
    await dataLayer.saveAttempt(payload);
    await bootstrap(true);
    const inserted = state.attempts.find((item) => item.id === payload.id) || payload;
    state.result = inserted;
    renderResult();
    renderTopStats();
    renderRankingPreview(state.currentTest.id);
    showView("result");

    await showAlert({
      icon: options.forced ? "warning" : "success",
      title: options.forced ? "Intento enviado automáticamente" : "Resultado guardado correctamente",
      html: buildTop10RankingHtml(state.currentTest.id, payload.id),
      confirmButtonText: "Ver resultado"
    });
  } catch (error) {
    console.error(error);
    state.examLocked = false;
    await showAlert({
      icon: "error",
      title: "No se pudo guardar el resultado",
      text: error?.message || "Revisá la conexión con Supabase e intentá nuevamente."
    });
    showView("home");
  }
}

function renderResult() {
  const r = state.result;
  const ranking = getAttemptRankings(r.test_id || state.currentTest?.id);
  const myPosition = ranking.findIndex((item) => item.id === r.id) + 1;
  el.resultSummary.innerHTML = [
    ["Alumno", `${r.last_name}, ${r.first_name}`],
    ["Test", r.test_title],
    ["Puntaje", `${r.correct_answers}/${r.total_questions}`],
    ["Porcentaje", `${Math.round(r.score_percentage)}%`],
    ["Tiempo", formatSeconds(r.duration_seconds)],
    ["Curso", `${r.course} ${r.division}`],
    ["Cronómetro", r.timer_mode === "asc" ? "Ascendente" : "Descendente"],
    ["Ranking", myPosition ? `#${myPosition}` : "Pendiente"],
    ["Estado", r.approved ? "Aprobado" : "En entrenamiento"]
  ].map(([label, value]) => `<div class="result-item"><span>${escapeHtml(label)}</span><strong>${escapeHtml(value)}</strong></div>`).join("");
}

function downloadTextFile(filename, content, mime = "text/plain;charset=utf-8;") {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function getExportSectionsFromForm() {
  return {
    tests: document.getElementById("exportTestsCheck")?.checked ?? true,
    questions: document.getElementById("exportQuestionsCheck")?.checked ?? true,
    attempts: document.getElementById("exportAttemptsCheck")?.checked ?? true,
    ranking: document.getElementById("exportRankingCheck")?.checked ?? true
  };
}

function getAllQuestionsForExport() {
  return state.tests.flatMap((test) => (test.questions || []).map((question, index) => ({
    test_title: test.title,
    area: test.area || "",
    position: question.position || index + 1,
    prompt: question.prompt,
    option_a: question.option_a,
    option_b: question.option_b,
    option_c: question.option_c,
    option_d: question.option_d,
    correct_option: question.correct_option,
    explanation: question.explanation || ""
  })));
}

function getRankingRowsForExport() {
  return state.tests.flatMap((test) => getAttemptRankings(test.id).map((item, index) => ({
    ranking: index + 1,
    test: test.title,
    alumno: `${item.last_name}, ${item.first_name}`,
    curso: `${item.course || ""} ${item.division || ""}`.trim(),
    puntaje: `${item.correct_answers}/${item.total_questions}`,
    porcentaje: `${Math.round(Number(item.score_percentage) || 0)}%`,
    tiempo: formatSeconds(item.duration_seconds),
    fecha: formatDateTime(item.created_at)
  })));
}

function buildSelectedCsv(sections) {
  const parts = [];
  if (sections.tests) {
    parts.push("CUESTIONARIOS");
    parts.push(["titulo","descripcion","area","duracion_min","cronometro","activo","preguntas","fecha_creacion"].map(csvEscape).join(","));
    state.tests.forEach((test) => parts.push([
      test.title, test.description || "", test.area || "", test.time_limit_minutes, test.timer_mode, test.is_active ? "SI" : "NO", (test.questions || []).length, test.created_at || ""
    ].map(csvEscape).join(",")));
    parts.push("");
  }
  if (sections.questions) {
    parts.push("PREGUNTAS");
    parts.push(["test","area","posicion","pregunta","opcion_a","opcion_b","opcion_c","opcion_d","correcta","explicacion"].map(csvEscape).join(","));
    getAllQuestionsForExport().forEach((q) => parts.push([
      q.test_title, q.area, q.position, q.prompt, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option, q.explanation
    ].map(csvEscape).join(",")));
    parts.push("");
  }
  if (sections.attempts) {
    parts.push("RESULTADOS DE TEST");
    parts.push(["fecha","test","apellido","nombre","dni","edad","curso","division","correctas","total","porcentaje","tiempo_segundos","cronometro","aprobado"].map(csvEscape).join(","));
    state.attempts.forEach((item) => parts.push([
      item.created_at, item.test_title, item.last_name, item.first_name, item.dni, item.age, item.course, item.division,
      item.correct_answers, item.total_questions, item.score_percentage, item.duration_seconds, item.timer_mode || "desc", item.approved ? "SI" : "NO"
    ].map(csvEscape).join(",")));
    parts.push("");
  }
  if (sections.ranking) {
    parts.push("CUADRO DE RANKING");
    parts.push(["ranking","test","alumno","curso","puntaje","porcentaje","tiempo","fecha"].map(csvEscape).join(","));
    getRankingRowsForExport().forEach((item) => parts.push([
      item.ranking, item.test, item.alumno, item.curso, item.puntaje, item.porcentaje, item.tiempo, item.fecha
    ].map(csvEscape).join(",")));
  }
  return parts.join("\n");
}

function exportAttemptsCsv(sections = { tests: false, questions: false, attempts: true, ranking: true }) {
  downloadTextFile("reporte_oatec.csv", buildSelectedCsv(sections), "text/csv;charset=utf-8;");
}

const OATEC_LOGO_DATA_URL = "data:image/png;base64,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";

async function imageUrlToDataUrl(url) {
  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch (_) {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });
}

function pdfAddSection(doc, title, head, body) {
  if (!body.length) return;
  const startY = (doc.lastAutoTable?.finalY || 42) + 12;
  if (startY > 260) doc.addPage();
  const y = doc.lastAutoTable?.finalY ? (doc.lastAutoTable.finalY + 12) : 52;
  doc.setFontSize(13);
  doc.setTextColor(20, 35, 70);
  doc.text(title, 14, y);
  doc.autoTable({
    head: [head],
    body,
    startY: y + 5,
    styles: { fontSize: 7, cellPadding: 2, overflow: "linebreak" },
    headStyles: { fillColor: [35, 55, 110], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [245, 247, 252] },
    margin: { left: 14, right: 14, top: 45, bottom: 25 }
  });
}

async function exportSelectedPdf(sections) {
  if (!window.jspdf?.jsPDF) {
    await showAlert({ icon: "error", title: "No se pudo exportar PDF", text: "No se cargó la librería jsPDF. Revisá la conexión a internet." });
    return;
  }
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const logoData = OATEC_LOGO_DATA_URL;

  function addHeader() {
    try { doc.addImage(logoData, "PNG", 14, 8, 22, 22); } catch (_) {}
    doc.setFontSize(18);
    doc.setTextColor(20, 35, 70);
    doc.text("Instituto San Miguel · OATec ITBA 2026", 42, 15);
    doc.setFontSize(13);
    doc.text("Reporte General", 42, 23);
    doc.setFontSize(9);
    doc.setTextColor(80, 90, 110);
    doc.text(`Fecha y hora: ${new Date().toLocaleString("es-AR")}`, 42, 30);
    doc.text("Generado desde el panel administrador", 42, 35);
    doc.setDrawColor(210, 220, 235);
    doc.line(14, 40, pageWidth - 14, 40);
  }

  addHeader();

  if (sections.tests) {
    pdfAddSection(doc, "Cuestionarios", ["Título", "Área", "Duración", "Timer", "Activo", "Preguntas"], state.tests.map((test) => [
      test.title, test.area || "", `${test.time_limit_minutes} min`, test.timer_mode === "asc" ? "Asc." : "Desc.", test.is_active ? "Sí" : "No", String((test.questions || []).length)
    ]));
  }
  if (sections.questions) {
    pdfAddSection(doc, "Preguntas", ["Test", "#", "Pregunta", "A", "B", "C", "D", "Correcta"], getAllQuestionsForExport().map((q) => [
      q.test_title, String(q.position), q.prompt, q.option_a, q.option_b, q.option_c, q.option_d, q.correct_option
    ]));
  }
  if (sections.attempts) {
    pdfAddSection(doc, "Resultado de Test", ["Fecha", "Alumno", "DNI", "Curso", "Test", "Puntaje", "%", "Tiempo"], state.attempts.map((item) => [
      formatDateTime(item.created_at), `${item.last_name}, ${item.first_name}`, item.dni || "", `${item.course || ""} ${item.division || ""}`.trim(), item.test_title, `${item.correct_answers}/${item.total_questions}`, `${Math.round(Number(item.score_percentage) || 0)}%`, formatSeconds(item.duration_seconds)
    ]));
  }
  if (sections.ranking) {
    pdfAddSection(doc, "Cuadro de Ranking", ["#", "Test", "Alumno", "Curso", "Puntaje", "%", "Tiempo", "Fecha"], getRankingRowsForExport().map((item) => [
      String(item.ranking), item.test, item.alumno, item.curso, item.puntaje, item.porcentaje, item.tiempo, item.fecha
    ]));
  }

  const pageCount = doc.internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i += 1) {
    doc.setPage(i);
    if (i > 1) addHeader();
    doc.setDrawColor(210, 220, 235);
    doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);
    doc.setFontSize(8);
    doc.setTextColor(90, 100, 120);
    doc.text("SIMULADOR OATec © 2026 Tucumán - Argentina", 14, pageHeight - 12);
    doc.text("by Ing. Fernando Gambino · Todos los Derechos Registrados", 14, pageHeight - 7);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 38, pageHeight - 7);
  }
  doc.save("reporte_oatec.pdf");
}

async function openExportDialog() {
  const result = await window.Swal.fire({
    title: "Exportar datos",
    html: `
      <div class="export-options">
        <label><input type="checkbox" id="exportTestsCheck" checked> Cuestionarios</label>
        <label><input type="checkbox" id="exportQuestionsCheck" checked> Preguntas</label>
        <label><input type="checkbox" id="exportAttemptsCheck" checked> Resultado de Test</label>
        <label><input type="checkbox" id="exportRankingCheck" checked> Cuadro de Ranking</label>
      </div>
      <p style="margin-top:12px;color:#9ea8c0;font-size:13px;">Elegí los datos y luego el formato de descarga.</p>
    `,
    icon: "info",
    showCancelButton: true,
    showDenyButton: true,
    confirmButtonText: "Exportar PDF",
    denyButtonText: "Exportar CSV",
    cancelButtonText: "Cancelar",
    didOpen: () => {
      const popup = window.Swal.getPopup();
      popup.querySelectorAll(".export-options label").forEach((label) => {
        label.style.display = "block";
        label.style.textAlign = "left";
        label.style.margin = "8px 0";
      });
    },
    ...getSwalThemeOptions()
  });
  if (result.isDismissed) return;
  const sections = getExportSectionsFromForm();
  if (!Object.values(sections).some(Boolean)) {
    await showAlert({ icon: "warning", title: "Sin datos seleccionados", text: "Seleccioná al menos una sección para exportar." });
    return;
  }
  if (result.isConfirmed) await exportSelectedPdf(sections);
  if (result.isDenied) exportAttemptsCsv(sections);
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
      const confirmDelete = await showConfirm({
        icon: "warning",
        title: "Eliminar test",
        text: "Se eliminará el test, sus preguntas y sus resultados. Esta acción no se puede deshacer.",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        danger: true
      });
      if (!confirmDelete.isConfirmed) return;
      await dataLayer.deleteTest(id);
      await bootstrap();
      if (state.adminAuthenticated) showView("admin");
      await showAlert({ icon: "success", title: "Test eliminado", text: "El test y sus datos asociados fueron eliminados." });
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
      const confirmDelete = await showConfirm({
        icon: "warning",
        title: "Eliminar intento",
        text: "Se eliminará este resultado del ranking.",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar",
        danger: true
      });
      if (!confirmDelete.isConfirmed) return;
      await dataLayer.deleteAttempt(btn.dataset.deleteAttempt);
      await bootstrap();
      if (state.adminAuthenticated) showView("admin");
      await showAlert({ icon: "success", title: "Intento eliminado", text: "El resultado fue eliminado correctamente." });
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
        const attemptsSource = state.adminAuthenticated ? "attempts" : "v_public_attempts";
        const [testsResponse, questionsResponse, attemptsResponse] = await Promise.all([
          supabaseClient.from("tests").select("*").order("created_at", { ascending: false }),
          supabaseClient.from("questions").select("*").order("position", { ascending: true }),
          supabaseClient.from(attemptsSource).select("*").order("created_at", { ascending: false })
        ]);

        if (testsResponse.error) throw new Error(getSupabaseErrorMessage(testsResponse.error));
        if (questionsResponse.error) throw new Error(getSupabaseErrorMessage(questionsResponse.error));
        if (attemptsResponse.error) throw new Error(getSupabaseErrorMessage(attemptsResponse.error));

        const questionsByTest = new Map();
        (questionsResponse.data || []).forEach((question) => {
          if (!questionsByTest.has(question.test_id)) questionsByTest.set(question.test_id, []);
          questionsByTest.get(question.test_id).push(question);
        });

        const merged = (testsResponse.data || []).map((test) => ({
          ...test,
          questions: questionsByTest.get(test.id) || []
        }));

        return {
          tests: normalizeLoadedTests(merged),
          attempts: attemptsResponse.data || []
        };
      },
      async saveAttempt(payload) {
        const { error } = await supabaseClient.from("attempts").insert(payload);
        if (error) throw new Error(getSupabaseErrorMessage(error));
      },
      async createTest(test, questions, onProgress = null) {
        const cleanTest = stripGeneratedTestFields(test);
        const cleanQuestions = questions
          .map((q, index) => ({
            ...stripGeneratedQuestionFields(q),
            position: index + 1
          }))
          .filter((q) =>
            q.prompt &&
            q.option_a &&
            q.option_b &&
            q.option_c &&
            q.option_d &&
            ["A", "B", "C", "D"].includes(q.correct_option)
          );

        if (!cleanTest.title) throw new Error("El título del test es obligatorio.");
        if (!cleanQuestions.length) throw new Error("No hay preguntas válidas para guardar.");

        onProgress?.({ stage: "test", uploaded: 0, total: cleanQuestions.length, percent: 5, text: "Creando el test en Supabase..." });

        const { data: inserted, error } = await supabaseClient
          .from("tests")
          .insert(cleanTest)
          .select("id,title")
          .single();

        if (error) throw new Error(getSupabaseErrorMessage(error));
        if (!inserted?.id) throw new Error("Supabase no devolvió el ID del test creado. Revisá permisos RLS y agregá .select().");

        const withTest = cleanQuestions.map((q) => ({
          ...q,
          test_id: inserted.id
        }));

        const chunkSize = 10;
        let uploaded = 0;

        for (let start = 0; start < withTest.length; start += chunkSize) {
          const chunk = withTest.slice(start, start + chunkSize);
          const { error: questionError } = await supabaseClient
            .from("questions")
            .insert(chunk);

          if (questionError) {
            await supabaseClient.from("tests").delete().eq("id", inserted.id);
            throw new Error(getSupabaseErrorMessage(questionError));
          }

          uploaded += chunk.length;
          const percent = 10 + Math.round((uploaded / withTest.length) * 85);
          onProgress?.({
            stage: "questions",
            uploaded,
            total: withTest.length,
            percent,
            text: `Subiendo preguntas a Supabase: ${uploaded} de ${withTest.length}...`
          });
        }

        onProgress?.({ stage: "done", uploaded, total: withTest.length, percent: 100, text: "Carga finalizada correctamente." });
        return inserted;
      },
      async deleteAttempt(id) {
        const { error } = await supabaseClient.from("attempts").delete().eq("id", id);
        if (error) throw new Error(getSupabaseErrorMessage(error));
      },
      async deleteTest(id) {
        const { error: attemptsError } = await supabaseClient.from("attempts").delete().eq("test_id", id);
        if (attemptsError) throw new Error(getSupabaseErrorMessage(attemptsError));
        const { error: questionsError } = await supabaseClient.from("questions").delete().eq("test_id", id);
        if (questionsError) throw new Error(getSupabaseErrorMessage(questionsError));
        const { error } = await supabaseClient.from("tests").delete().eq("id", id);
        if (error) throw new Error(getSupabaseErrorMessage(error));
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
    async createTest(test, questions, onProgress = null) {
      const local = loadLocalData();
      onProgress?.({ stage: "local", uploaded: questions.length, total: questions.length, percent: 100, text: "Guardado en modo local." });
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
    showToast(error?.message || "No se pudieron sincronizar los datos con Supabase.");
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

  document.getElementById("cancelTestBtn").addEventListener("click", async () => {
    if (!state.currentTest) return showView("home");
    const result = await showConfirm({
      icon: "warning",
      title: "Cancelar intento",
      text: "Si cancelás, este intento no se guardará. ¿Querés volver al inicio?",
      confirmButtonText: "Volver al inicio",
      cancelButtonText: "Continuar test",
      danger: true
    });
    if (!result.isConfirmed) return;
    clearInterval(state.timerId);
    state.currentTest = null;
    state.answers = {};
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
  const confirmLogout = await showConfirm({
    icon: "question",
    title: "Cerrar sesión",
    text: "¿Deseás salir del panel administrador?",
    confirmButtonText: "Cerrar sesión",
    cancelButtonText: "Cancelar",
    danger: true
  });
  if (!confirmLogout.isConfirmed) return;

  const logoutBtn = document.getElementById("adminLogoutBtn");
  try {
    if (logoutBtn) {
      logoutBtn.disabled = true;
      logoutBtn.textContent = "Cerrando...";
    }
    await logoutAdminSession();
    el.adminLoginOverlay?.classList.add("hidden");
    showView("home");
    renderTopStats();
    renderTestSelect();
    await showAlert({ icon: "success", title: "Sesión cerrada", text: "Volviste a la pantalla principal." });
  } catch (error) {
    console.error(error);
    await showAlert({ icon: "error", title: "No se pudo cerrar sesión", text: error.message || "Intentá nuevamente." });
  } finally {
    if (logoutBtn) {
      logoutBtn.disabled = false;
      logoutBtn.textContent = "Cerrar sesión";
    }
  }
});

  document.getElementById("adminRefreshBtn").addEventListener("click", async () => {
    await bootstrap();
    showView("admin");
    showToast("Panel actualizado.");
  });

  document.getElementById("exportAttemptsBtn").addEventListener("click", openExportDialog);
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
      await showAlert({ icon: "success", title: "TXT importado", text: `Se cargaron ${parsed.questions.length} preguntas correctamente.` });
    } catch (error) {
      console.error(error);
      await showAlert({ icon: "error", title: "No se pudo leer el TXT", text: "Verificá el formato del archivo e intentá nuevamente." });
    }
  });

  el.createTestForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    const submitBtn = el.createTestForm.querySelector('button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = "Guardando...";
    }
    try {
      const parsed = JSON.parse(el.questionsJson.value || "[]");
      if (!Array.isArray(parsed)) throw new Error("El campo Preguntas debe contener un array JSON.");

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

      const confirmSave = await showConfirm({
        icon: "question",
        title: "Guardar test",
        html: `<div style="text-align:left">
          <p><strong>Título:</strong> ${escapeHtml(test.title)}</p>
          <p><strong>Área:</strong> ${escapeHtml(test.area || "General")}</p>
          <p><strong>Preguntas:</strong> ${questions.length}</p>
          <p style="margin-top:10px;color:#9ea8c0;">Se cargará el cuestionario y sus preguntas en Supabase.</p>
        </div>`,
        confirmButtonText: "Sí, guardar",
        cancelButtonText: "Cancelar"
      });
      if (!confirmSave.isConfirmed) return;

      openSaveProgress(questions.length);
      await dataLayer.createTest(test, questions, ({ percent, uploaded, total, text }) => {
        updateSaveProgress({ percent, uploaded, total, text });
      });
      updateSaveProgress({ percent: 100, uploaded: questions.length, total: questions.length, text: "Sincronizando panel y listado de tests..." });
      el.createTestForm.reset();
      el.questionsJson.value = "";
      el.testTimerMode.value = "desc";
      el.testActive.value = "true";
      el.txtImportInput.value = "";
      await bootstrap();
      showView("admin");
      closeSaveProgress();
      await showAlert({ icon: "success", title: "Test creado correctamente", text: `Se guardaron ${questions.length} preguntas en Supabase.` });
    } catch (error) {
      console.error("No se pudo crear el test:", error);
      closeSaveProgress();
      await showAlert({ icon: "error", title: "No se pudo crear el test", text: error.message || "Revisá el contenido e intentá nuevamente." });
    } finally {
      closeSaveProgress();
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = "Guardar test";
      }
    }
  });

  document.addEventListener("visibilitychange", examVisibilityGuard);
  window.addEventListener("blur", examBlurGuard);
  document.addEventListener("contextmenu", examContextMenuGuard);
  document.addEventListener("keydown", examKeydownGuard);
  window.addEventListener("beforeunload", (event) => {
    if (views.exam.classList.contains("active") && state.currentTest && !state.examLocked) {
      event.preventDefault();
      event.returnValue = "";
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
