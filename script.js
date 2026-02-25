/* ========= CONFIG ========= */
// MUDE AQUI a senha (deixe igual no admin.html também)
const ADMIN_PASSWORD = "Fatec@20261";

const LS_KEYS = {
  NOTES: "acad_notes_v1",
  AGENDA: "acad_agenda_v1",
  ADMIN: "acad_is_admin_v1"
};

function readJSON(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key) || fallback); }
  catch { return JSON.parse(fallback); }
}
function writeJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
function isAdmin() {
  return localStorage.getItem(LS_KEYS.ADMIN) === "1";
}
function setAdmin(flag) {
  localStorage.setItem(LS_KEYS.ADMIN, flag ? "1" : "0");
}
function genId(){ return "id_" + Math.random().toString(36).slice(2,9); }

function readNotes(){ return readJSON(LS_KEYS.NOTES, "[]"); }
function writeNotes(data){ writeJSON(LS_KEYS.NOTES, data); }

function readAgenda(){ return readJSON(LS_KEYS.AGENDA, "[]"); }
function writeAgenda(data){ writeJSON(LS_KEYS.AGENDA, data); }

/* ========= DOM ========= */
document.getElementById("ano").textContent = new Date().getFullYear();

const btnTheme = document.getElementById("btnTheme");
const savedTheme = localStorage.getItem("theme");
if (savedTheme === "light") document.documentElement.setAttribute("data-theme", "light");

btnTheme.addEventListener("click", () => {
  const isLight = document.documentElement.getAttribute("data-theme") === "light";
  if (isLight) {
    document.documentElement.removeAttribute("data-theme");
    localStorage.setItem("theme", "dark");
  } else {
    document.documentElement.setAttribute("data-theme", "light");
    localStorage.setItem("theme", "light");
  }
});

const btnMenu = document.getElementById("btnMenu");
const menuLinks = document.getElementById("menuLinks");
btnMenu.addEventListener("click", () => {
  const open = menuLinks.classList.toggle("is-open");
  btnMenu.setAttribute("aria-expanded", String(open));
});

const btnAdminLogout = document.getElementById("btnAdminLogout");
const btnAdminLogin = document.getElementById("btnAdminLogin");

const boardEl = document.getElementById("board");
const agendaEl = document.getElementById("agendaContainer");
const deliveriesPreview = document.getElementById("deliveriesPreview");
const adminAddNoteArea = document.getElementById("adminAddNoteArea");
const adminAddAgendaArea = document.getElementById("adminAddAgendaArea");

const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter");

/* Editor Modal */
const editorModal = document.getElementById("editorModal");
const editorTitle = document.getElementById("editorTitle");
const noteEditor = document.getElementById("noteEditor");
const agendaEditor = document.getElementById("agendaEditor");

const noteTitle = document.getElementById("noteTitle");
const noteCat = document.getElementById("noteCat");
const noteDate = document.getElementById("noteDate");
const notePriority = document.getElementById("notePriority");
const noteText = document.getElementById("noteText");

const agendaDate = document.getElementById("agendaDate");
const agendaTitle = document.getElementById("agendaTitle");
const agendaDesc = document.getElementById("agendaDesc");
const agendaType = document.getElementById("agendaType");

const editorSave = document.getElementById("editorSave");
const editorCancel = document.getElementById("editorCancel");

let editorMode = null; // "note-add","note-edit","agenda-add","agenda-edit"
let editorEditId = null;

/* ========= INIT SAMPLE DATA ========= */
function ensureSampleData(){
  if (!localStorage.getItem(LS_KEYS.NOTES)) {
    writeNotes([
      { id: genId(), cat:"gestao", title:"Validação 1", date:"2026-03-10", priority:"normal", text:"Entregar escopo + cronograma + riscos iniciais." },
      { id: genId(), cat:"web", title:"Atividade 01", date:"2026-03-12", priority:"important", text:"Layout responsivo + filtro por categoria + busca." },
      { id: genId(), cat:"ti", title:"Entrega: Indicadores", date:"2026-03-15", priority:"urgent", text:"Definir 5 KPIs com meta." }
    ]);
  }
  if (!localStorage.getItem(LS_KEYS.AGENDA)) {
    writeAgenda([
      { id: genId(), date:"2026-03-10", title:"Validação 1 — Gestão de Projetos", desc:"Prazo final", type:"prazo" },
      { id: genId(), date:"2026-03-12", title:"Atividade 01 — Web II", desc:"Entrega da atividade", type:"prazo" }
    ]);
  }
}

/* ========= ADMIN UI ========= */
function updateAdminUI(){
  const logged = isAdmin();
  btnAdminLogin.classList.toggle("hidden", logged);
  btnAdminLogout.classList.toggle("hidden", !logged);

  if (logged) {
    adminAddNoteArea.innerHTML = `<button id="btnAddNote" class="btn">+ Novo aviso</button>`;
    document.getElementById("btnAddNote").addEventListener("click", () => openEditor("note-add"));

    adminAddAgendaArea.innerHTML = `<button id="btnAddAgenda" class="btn">+ Novo item na agenda</button>`;
    document.getElementById("btnAddAgenda").addEventListener("click", () => openEditor("agenda-add"));
  } else {
    adminAddNoteArea.innerHTML = "";
    adminAddAgendaArea.innerHTML = "";
  }

  renderBoard();
  renderAgenda();
  renderDeliveriesPreview();
}

/* logout */
btnAdminLogout.addEventListener("click", () => {
  setAdmin(false);
  updateAdminUI();
});

/* ========= RENDER ========= */
function catLabel(code) {
  const map = {gestao:"Gestão de Projetos", ti:"Governança de TI", web:"Programação Web II", si:"Sistemas de Informação", es:"Engenharia de Software II", log:"Informática Aplicada à Logística"};
  return map[code] || code;
}
function formatDateForDisplay(iso) {
  if (!iso) return "—";
  const parts = iso.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return iso;
}

function renderBoard(){
  const notes = readNotes();
  const activeFilter = document.querySelector(".filter.is-active")?.dataset.filter || "todos";
  const q = (searchInput.value || "").toLowerCase().trim();

  boardEl.innerHTML = "";
  notes.forEach(note => {
    const hay = (note.title + " " + note.text).toLowerCase();
    if (q && !hay.includes(q)) return;
    if (activeFilter !== "todos" && note.cat !== activeFilter) return;

    const el = document.createElement("article");
    el.className = "note " + (note.priority === "urgent" ? "note--red" : note.priority === "important" ? "note--blue" : "");
    el.innerHTML = `
      <header class="note__head">
        <span class="note__tag">${catLabel(note.cat)}</span>
        <span class="note__date">📅 ${formatDateForDisplay(note.date)}</span>
      </header>
      <h3>${escapeHTML(note.title)}</h3>
      <p>${escapeHTML(note.text)}</p>
    `;

    if (isAdmin()) {
      const actions = document.createElement("div");
      actions.className = "item-actions";
      actions.innerHTML = `
        <button class="btn btn--ghost" data-action="edit-note" data-id="${note.id}">Editar</button>
        <button class="btn" data-action="del-note" data-id="${note.id}">Excluir</button>
      `;
      el.appendChild(actions);
    }

    boardEl.appendChild(el);
  });

  if (isAdmin()) {
    document.querySelectorAll('[data-action="edit-note"]').forEach(btn => {
      btn.addEventListener("click", () => openEditor("note-edit", btn.dataset.id));
    });
    document.querySelectorAll('[data-action="del-note"]').forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Excluir este aviso?")) deleteNote(btn.dataset.id);
      });
    });
  }
}

function renderAgenda(){
  const items = readAgenda().slice().sort((a,b)=> (a.date||"").localeCompare(b.date||""));
  const q = (searchInput.value || "").toLowerCase().trim();

  agendaEl.innerHTML = "";
  items.forEach(it => {
    const hay = (it.title + " " + (it.desc||"")).toLowerCase();
    if (q && !hay.includes(q)) return;

    const row = document.createElement("div");
    row.className = "agenda__row";
    row.innerHTML = `
      <span class="agenda__date">${formatDateForDisplay(it.date)}</span>
      <span class="agenda__title">${escapeHTML(it.title)}</span>
      <span class="agenda__status badgeOk">${escapeHTML(it.type)}</span>
    `;

    if (isAdmin()) {
      const actions = document.createElement("div");
      actions.className = "item-actions";
      actions.style.gridColumn = "1 / -1";
      actions.innerHTML = `
        <button class="btn btn--ghost" data-action="edit-ag" data-id="${it.id}">Editar</button>
        <button class="btn" data-action="del-ag" data-id="${it.id}">Excluir</button>
      `;
      row.appendChild(actions);
    }

    agendaEl.appendChild(row);
  });

  if (isAdmin()) {
    document.querySelectorAll('[data-action="edit-ag"]').forEach(btn => {
      btn.addEventListener("click", () => openEditor("agenda-edit", btn.dataset.id));
    });
    document.querySelectorAll('[data-action="del-ag"]').forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Excluir este item da agenda?")) deleteAgenda(btn.dataset.id);
      });
    });
  }
}

function renderDeliveriesPreview(){
  const notes = readNotes().slice(0,4).map(n => ({type:"Aviso", date:n.date, title:n.title}));
  const ag = readAgenda().slice(0,4).map(a => ({type:"Agenda", date:a.date, title:a.title}));
  const combined = [...notes, ...ag].filter(x=>x.date).sort((a,b)=>a.date.localeCompare(b.date)).slice(0,4);

  deliveriesPreview.innerHTML = "";
  combined.forEach(item => {
    const el = document.createElement("div");
    el.className = "delivery";
    el.innerHTML = `
      <div class="delivery__left">
        <span class="delivery__date">${formatDateForDisplay(item.date)}</span>
        <span class="delivery__title">${escapeHTML(item.title)}</span>
      </div>
      <span class="delivery__tag">${item.type}</span>
    `;
    deliveriesPreview.appendChild(el);
  });
}

/* ========= CRUD ========= */
function addNote(note){
  const all = readNotes();
  all.unshift(note);
  writeNotes(all);
  updateAdminUI();
}
function updateNote(id, patch){
  const all = readNotes().map(n => n.id === id ? {...n, ...patch} : n);
  writeNotes(all);
  updateAdminUI();
}
function deleteNote(id){
  writeNotes(readNotes().filter(n => n.id !== id));
  updateAdminUI();
}

function addAgenda(item){
  const all = readAgenda();
  all.unshift(item);
  writeAgenda(all);
  updateAdminUI();
}
function updateAgenda(id, patch){
  const all = readAgenda().map(a => a.id === id ? {...a, ...patch} : a);
  writeAgenda(all);
  updateAdminUI();
}
function deleteAgenda(id){
  writeAgenda(readAgenda().filter(a => a.id !== id));
  updateAdminUI();
}

/* ========= Editor Modal ========= */
function openEditor(mode, editId=null){
  if (!isAdmin()) return;

  editorMode = mode;
  editorEditId = editId;

  // reset
  noteTitle.value=""; noteCat.value="gestao"; noteDate.value=""; notePriority.value="normal"; noteText.value="";
  agendaDate.value=""; agendaTitle.value=""; agendaDesc.value=""; agendaType.value="prazo";

  if (mode.startsWith("note")) {
    noteEditor.classList.remove("hidden");
    agendaEditor.classList.add("hidden");
    editorTitle.textContent = mode === "note-add" ? "Adicionar aviso" : "Editar aviso";

    if (mode === "note-edit") {
      const note = readNotes().find(n => n.id === editId);
      if (note) {
        noteTitle.value = note.title || "";
        noteCat.value = note.cat || "gestao";
        noteDate.value = note.date || "";
        notePriority.value = note.priority || "normal";
        noteText.value = note.text || "";
      }
    }
  } else {
    noteEditor.classList.add("hidden");
    agendaEditor.classList.remove("hidden");
    editorTitle.textContent = mode === "agenda-add" ? "Adicionar item da agenda" : "Editar item da agenda";

    if (mode === "agenda-edit") {
      const it = readAgenda().find(a => a.id === editId);
      if (it) {
        agendaDate.value = it.date || "";
        agendaTitle.value = it.title || "";
        agendaDesc.value = it.desc || "";
        agendaType.value = it.type || "prazo";
      }
    }
  }

  editorModal.classList.remove("hidden");
}

function closeEditor(){
  editorModal.classList.add("hidden");
  editorMode = null;
  editorEditId = null;
}

editorCancel.addEventListener("click", closeEditor);
editorSave.addEventListener("click", () => {
  if (!isAdmin()) return;

  if (editorMode === "note-add") {
    addNote({
      id: genId(),
      title: noteTitle.value || "(sem título)",
      cat: noteCat.value,
      date: noteDate.value || "",
      priority: notePriority.value,
      text: noteText.value || ""
    });
  }

  if (editorMode === "note-edit" && editorEditId) {
    updateNote(editorEditId, {
      title: noteTitle.value,
      cat: noteCat.value,
      date: noteDate.value,
      priority: notePriority.value,
      text: noteText.value
    });
  }

  if (editorMode === "agenda-add") {
    addAgenda({
      id: genId(),
      date: agendaDate.value || "",
      title: agendaTitle.value || "(sem título)",
      desc: agendaDesc.value || "",
      type: agendaType.value
    });
  }

  if (editorMode === "agenda-edit" && editorEditId) {
    updateAgenda(editorEditId, {
      date: agendaDate.value,
      title: agendaTitle.value,
      desc: agendaDesc.value,
      type: agendaType.value
    });
  }

  closeEditor();
});

/* ========= Search + Filters ========= */
function applyFilters(){
  renderBoard();
  renderAgenda();
  renderDeliveriesPreview();
}
searchInput.addEventListener("input", applyFilters);
filterBtns.forEach(btn => btn.addEventListener("click", () => {
  filterBtns.forEach(b=>b.classList.remove("is-active"));
  btn.classList.add("is-active");
  applyFilters();
}));

/* ========= Counter ========= */
function animateCounter(el, to) {
  const duration = 800;
  const start = performance.now();
  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.floor(to * t);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
const counters = document.querySelectorAll("[data-counter]");
const obs = new IntersectionObserver((entries, o) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      animateCounter(e.target, Number(e.target.dataset.counter || 0));
      o.unobserve(e.target);
    }
  });
}, { threshold: 0.4 });
counters.forEach(el => obs.observe(el));

/* ========= Utils ========= */
function escapeHTML(str){
  return (str ?? "").toString()
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

/* ========= START ========= */
ensureSampleData();
updateAdminUI();
applyFilters();
