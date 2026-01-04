/* ManagerGPT — Online Vibe Coder (client)
 *
 * - Persists chat + editor in localStorage
 * - Calls Netlify function /.netlify/functions/managergpt if available
 * - Falls back to an offline “vibe” responder if not configured
 */

const STORAGE_KEY = "managergpt.v1";
const API_URL = "/.netlify/functions/managergpt";

const els = {
  apiStatus: document.getElementById("apiStatus"),
  messages: document.getElementById("messages"),
  composer: document.getElementById("composer"),
  prompt: document.getElementById("prompt"),
  sendBtn: document.getElementById("sendBtn"),
  applyBtn: document.getElementById("applyBtn"),
  editor: document.getElementById("editor"),
  copyBtn: document.getElementById("copyBtn"),
  downloadBtn: document.getElementById("downloadBtn"),
  newSessionBtn: document.getElementById("newSessionBtn"),
  vibeModeToggle: document.getElementById("vibeModeToggle"),
};

/** @typedef {{role: "user"|"assistant"|"system", content: string}} Msg */

/** @type {{messages: Msg[], editorText: string, vibeMode: boolean, lastAssistantCodeBlock?: string}} */
let state = {
  messages: [],
  editorText: "",
  vibeMode: true,
  lastAssistantCodeBlock: "",
};

function saveState() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return;
    state = {
      ...state,
      ...parsed,
      messages: Array.isArray(parsed.messages) ? parsed.messages : [],
    };
  } catch {
    // ignore
  }
}

function setStatus(text, kind) {
  els.apiStatus.textContent = text;
  els.apiStatus.classList.remove("good", "bad");
  if (kind) els.apiStatus.classList.add(kind);
}

function escapeHtml(s) {
  return s
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderMessages() {
  els.messages.innerHTML = "";
  for (const m of state.messages) {
    const div = document.createElement("div");
    div.className = `msg ${m.role === "user" ? "user" : "assistant"}`;
    div.innerHTML = `<div class="role">${escapeHtml(m.role)}</div><div class="content">${escapeHtml(
      m.content || ""
    )}</div>`;
    els.messages.appendChild(div);
  }
  els.messages.scrollTop = els.messages.scrollHeight;
}

function extractFirstCodeBlock(text) {
  // Matches ```lang?\n...``` with minimal capture.
  const m = text.match(/```[^\n]*\n([\s\S]*?)```/);
  return m ? m[1].trim() : "";
}

function updateApplyButtonFromLastAssistantMessage() {
  const last = [...state.messages].reverse().find((m) => m.role === "assistant");
  const code = last ? extractFirstCodeBlock(last.content || "") : "";
  state.lastAssistantCodeBlock = code;
  els.applyBtn.disabled = !code;
  saveState();
}

function addMessage(role, content) {
  state.messages.push({ role, content });
  renderMessages();
  updateApplyButtonFromLastAssistantMessage();
  saveState();
}

async function hasOnlineApi() {
  try {
    const res = await fetch(API_URL, { method: "OPTIONS" });
    // Some hosts return 404 for OPTIONS; try a lightweight POST ping after.
    if (res.status === 200 || res.status === 204) return true;
  } catch {
    // ignore
  }
  return false;
}

function offlineVibeResponder({ prompt, editorText, vibeMode }) {
  const style = vibeMode
    ? "Playful, exploratory, and practical."
    : "Direct, concise, and practical.";

  const trimmedPrompt = (prompt || "").trim();
  const hint =
    editorText && editorText.trim()
      ? "I see you already have code in the editor—tell me what you want to change and I’ll propose an updated version in a single code block."
      : "If you want, tell me the app you want and what stack (HTML/CSS/JS, React, etc.). I’ll generate a first draft in a single code block.";

  const example =
    editorText && editorText.trim()
      ? ""
      : "\n\nExample prompt: “Build a responsive landing page with a hero, pricing cards, and a FAQ.”";

  return [
    `ManagerGPT (offline mode)\n`,
    `Style: ${style}\n`,
    `You said: ${trimmedPrompt || "(empty)"}\n\n`,
    `${hint}${example}\n\n`,
    `Why offline? The server function isn't configured with an API key yet. Set \`OPENAI_API_KEY\` on your host to enable online responses.`,
  ].join("");
}

async function callManagerGpt({ messages, editorText, vibeMode }) {
  const body = {
    messages,
    editor: editorText,
    vibeMode,
  };

  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let extra = "";
    try {
      extra = await res.text();
    } catch {
      // ignore
    }
    throw new Error(`API error (${res.status}): ${extra || res.statusText}`);
  }

  const data = await res.json();
  if (!data || typeof data.reply !== "string") {
    throw new Error("Malformed API response.");
  }
  return data.reply;
}

async function sendPrompt() {
  const prompt = els.prompt.value.trim();
  if (!prompt) return;

  els.prompt.value = "";
  addMessage("user", prompt);

  const contextMessages = state.messages.slice(-12); // lightweight context window
  setStatus("Thinking…", "good");
  els.sendBtn.disabled = true;

  try {
    const reply = await callManagerGpt({
      messages: contextMessages,
      editorText: state.editorText,
      vibeMode: state.vibeMode,
    });
    addMessage("assistant", reply);
    setStatus("Online", "good");
  } catch (err) {
    const reply = offlineVibeResponder({
      prompt,
      editorText: state.editorText,
      vibeMode: state.vibeMode,
    });
    addMessage("assistant", reply);
    setStatus("Offline (configure API key to go online)", "bad");
  } finally {
    els.sendBtn.disabled = false;
  }
}

function newSession() {
  state.messages = [
    {
      role: "assistant",
      content:
        "Hey — I’m ManagerGPT.\nDrop your goal, constraints, and the current state (or paste code into the editor). I’ll propose the next best move.\n\nTip: if I include a code block, you can click “Apply code” to replace the editor.",
    },
  ];
  state.lastAssistantCodeBlock = "";
  els.applyBtn.disabled = true;
  renderMessages();
  saveState();
}

function applyLastCodeBlock() {
  const code = state.lastAssistantCodeBlock || "";
  if (!code) return;
  els.editor.value = code;
  state.editorText = code;
  saveState();
}

async function copyEditor() {
  const text = els.editor.value || "";
  try {
    await navigator.clipboard.writeText(text);
    setStatus("Copied editor to clipboard", "good");
    setTimeout(() => setStatus(stateHasOnline ? "Online" : "Offline", stateHasOnline ? "good" : "bad"), 1200);
  } catch {
    // fallback
    els.editor.focus();
    els.editor.select();
    document.execCommand("copy");
  }
}

function downloadEditor() {
  const text = els.editor.value || "";
  const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "managergpt-scratchpad.txt";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

// --- Events ---

els.composer.addEventListener("submit", (e) => {
  e.preventDefault();
  void sendPrompt();
});

els.prompt.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    void sendPrompt();
  }
});

els.applyBtn.addEventListener("click", () => applyLastCodeBlock());
els.copyBtn.addEventListener("click", () => void copyEditor());
els.downloadBtn.addEventListener("click", () => downloadEditor());
els.newSessionBtn.addEventListener("click", () => newSession());

els.vibeModeToggle.addEventListener("change", () => {
  state.vibeMode = !!els.vibeModeToggle.checked;
  saveState();
});

els.editor.addEventListener("input", () => {
  state.editorText = els.editor.value || "";
  saveState();
});

// --- Boot ---

loadState();

if (!state.messages.length) {
  newSession();
} else {
  els.editor.value = state.editorText || "";
  els.vibeModeToggle.checked = state.vibeMode !== false;
  renderMessages();
  updateApplyButtonFromLastAssistantMessage();
}

let stateHasOnline = false;
setStatus("Checking…", "good");
hasOnlineApi()
  .then((ok) => {
    stateHasOnline = ok;
    setStatus(ok ? "Online" : "Offline (configure API key to go online)", ok ? "good" : "bad");
  })
  .catch(() => setStatus("Offline (configure API key to go online)", "bad"));

