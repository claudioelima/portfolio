/* ========== CONFIGURAÇÕES ========= */
// Senha do admin (mude aqui antes de publicar)
const ADMIN_PASSWORD = "Fatec@20261"; // <-- altere isto

/* ========== HELPERS e STATE (localStorage) ========= */
const LS_KEYS = {
  NOTES: "acad_notes_v1",
  AGENDA: "acad_agenda_v1",
  ADMIN: "acad_is_admin_v1"
};

function readNotes() {
  try { return JSON.parse(localStorage.getItem(LS_KEYS.NOTES) || "[]"); }
  catch { return []; }
}
function writeNotes(data) {
  localStorage.setItem(LS_KEYS.NOTES, JSON.stringify(data));
}
function readAgenda() {
  try { return JSON.parse(localStorage.getItem(LS_KEYS.AGENDA) || "[]"); }
  catch { return []; }
}
function writeAgenda(data) {
  localStorage.setItem(LS_KEYS.AGENDA, JSON.stringify(data));
}
function isAdmin() {
  return localStorage.getItem(LS_KEYS.ADMIN) === "1";
}
function setAdmin(flag) {
  localStorage.setItem(LS_KEYS.ADMIN, flag ? "1" : "0");
}

/* ========== DOM shortcuts ========= */
const boardEl = document.getElementById("board");
const agendaEl = document.getElementById("agendaContainer");
const deliveriesPreview = document.getElementById("deliveriesPreview");
const adminAddNoteArea = document.getElementById("adminAddNoteArea");
const adminAddAgendaArea = document.getElementById("adminAddAgendaArea");

const adminModal = document.getElementById("adminModal");
const adminPwdInput = document.getElementById("adminPasswordInput");
const adminLoginSubmit = document.getElementById("adminLoginSubmit");
const adminLoginCancel = document.getElementById("adminLoginCancel");
const btnAdminLogin = document.getElementById("btnAdminLogin");
const btnAdminLogout = document.getElementById("btnAdminLogout");

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

const searchInput = document.getElementById("searchInput");
const filterBtns = document.querySelectorAll(".filter");

/* state for editor */
let editorMode = null; // "note-add","note-edit","agenda-add","agenda-edit"
let editorEditId = null;

/* ========== Inicialização ========== */
function init() {
  // ensure default sample data if empty
  if (!localStorage.getItem(LS_KEYS.NOTES)) {
    const sampleNotes = [
      { id: genId(), cat:"gestao", title:"Validação 1", date:"2026-03-10", priority:"normal", text:"Entregar escopo + cronograma + riscos iniciais." },
      { id: genId(), cat:"web", title:"Atividade 01", date:"2026-03-12", priority:"important", text:"Layout responsivo + filtro por categoria + busca." },
      { id: genId(), cat:"ti", title:"Entrega: Indicadores", date:"2026-03-15", priority:"urgent", text:"Definir 5 KPIs com meta." }
    ];
    writeNotes(sampleNotes);
  }
  if (!localStorage.getItem(LS_KEYS.AGENDA)) {
    const sampleAgenda = [
      { id: genId(), date:"2026-03-10", title:"Validação 1 — Gestão de Projetos", desc:"Prazo final", type:"prazo" },
      { id: genId(), date:"2026-03-12", title:"Atividade 01 — Web II", desc:"Entrega da atividade", type:"prazo" }
    ];
    writeAgenda(sampleAgenda);
  }

  // render initial
  renderBoard();
  renderAgenda();
  renderDeliveriesPreview();
  updateAdminUI();

  // event bindings
  btnAdminLogin.addEventListener("click", () => openAdminModal());
  btnAdminLogout.addEventListener("click", () => logoutAdmin());
  adminLoginCancel.addEventListener("click", () => closeAdminModal());
  adminLoginSubmit.addEventListener("click", submitAdminLogin);

  // search + filters behavior (reuse from previous)
  searchInput.addEventListener("input", applyFilters);
  filterBtns.forEach(btn => btn.addEventListener("click", () => {
    filterBtns.forEach(b=>b.classList.remove("is-active"));
    btn.classList.add("is-active");
    applyFilters();
  }));

  // editor modal
  editorCancel.addEventListener("click", closeEditorModal);
  editorSave.addEventListener("click", saveEditor);

  // keyboard: Esc to close modals
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      closeAdminModal();
      closeEditorModal();
    }
  });

  // show admin add buttons if admin
  if (isAdmin()) showAdminControls();
}

/* ========== utility ========= */
function genId() {
  return "id_" + Math.random().toString(36).slice(2,9);
}

/* ========== ADMIN FLOW ========= */
function openAdminModal() {
  adminPwdInput.value = "";
  adminModal.classList.remove("hidden");
  adminPwdInput.focus();
}
function closeAdminModal() {
  adminModal.classList.add("hidden");
}
function submitAdminLogin() {
  const val = adminPwdInput.value || "";
  if (val === ADMIN_PASSWORD) {
    setAdmin(true);
    updateAdminUI();
    closeAdminModal();
    showToast("Login de admin efetuado.");
  } else {
    showToast("Senha incorreta.", true);
  }
}
function logoutAdmin() {
  setAdmin(false);
  updateAdminUI();
  showToast("Logout realizado.");
}

function updateAdminUI() {
  const logged = isAdmin();
  document.getElementById("btnAdminLogin").classList.toggle("hidden", logged);
  document.getElementById("btnAdminLogout").classList.toggle("hidden", !logged);

  // create or remove admin add buttons
  if (logged) showAdminControls();
  else hideAdminControls();
}

/* show admin controls */
function showAdminControls() {
  // area: add note button
  adminAddNoteArea.innerHTML = `
    <button id="btnAddNote" class="btn">+ Novo aviso</button>
  `;
  document.getElementById("btnAddNote").addEventListener("click", () => {
    openEditor("note-add");
  });

  // area: add agenda button
  adminAddAgendaArea.innerHTML = `
    <button id="btnAddAgenda" class="btn">+ Novo item na agenda</button>
  `;
  document.getElementById("btnAddAgenda").addEventListener("click", () => {
    openEditor("agenda-add");
  });

  // also show edit buttons on individual items when rendering board/agenda
  renderBoard();
  renderAgenda();
}

/* hide admin controls */
function hideAdminControls() {
  adminAddNoteArea.innerHTML = "";
  adminAddAgendaArea.innerHTML = "";
  renderBoard();
  renderAgenda();
}

/* ========== RENDER Board (Mural) ========= */
function renderBoard() {
  const notes = readNotes();
  // apply filter & search
  const activeFilter = document.querySelector(".filter.is-active")?.dataset.filter || "todos";
  const q = (searchInput.value || "").toLowerCase().trim();

  boardEl.innerHTML = "";
  notes.forEach(note => {
    const textLower = (note.text + " " + note.title).toLowerCase();
    const matchText = !q || textLower.includes(q);
    const matchCat = activeFilter === "todos" || note.cat === activeFilter;
    if (!matchText || !matchCat) return;

    const noteEl = document.createElement("article");
    noteEl.className = "note " + (note.priority === "urgent" ? "note--red" : note.priority === "important" ? "note--blue" : "");
    noteEl.dataset.cat = note.cat;
    noteEl.dataset.text = note.text;

    const head = document.createElement("header");
    head.className = "note__head";
    head.innerHTML = `<span class="note__tag">${catLabel(note.cat)}</span><span class="note__date">📅 ${formatDateForDisplay(note.date)}</span>`;
    noteEl.appendChild(head);

    const h3 = document.createElement("h3");
    h3.textContent = note.title;
    noteEl.appendChild(h3);

    const p = document.createElement("p");
    p.textContent = note.text;
    noteEl.appendChild(p);

    // admin actions
    if (isAdmin()) {
      const actions = document.createElement("div");
      actions.className = "item-actions";
      actions.innerHTML = `
        <button class="btn btn--ghost" data-action="edit" data-id="${note.id}">Editar</button>
        <button class="btn" data-action="delete" data-id="${note.id}">Excluir</button>
      `;
      noteEl.appendChild(actions);
    }

    boardEl.appendChild(noteEl);
  });

  // bind admin action buttons
  if (isAdmin()) {
    document.querySelectorAll('[data-action="edit"]').forEach(btn => {
      btn.addEventListener("click", () => {
        openEditor("note-edit", btn.dataset.id);
      });
    });
    document.querySelectorAll('[data-action="delete"]').forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Excluir este aviso?")) {
          deleteNoteById(btn.dataset.id);
        }
      });
    });
  }
}

/* ========== Board CRUD ========= */
function addNote(note) {
  const all = readNotes();
  all.unshift(note); // newest first
  writeNotes(all);
  renderBoard();
  renderDeliveriesPreview();
}
function updateNote(id, data) {
  const all = readNotes().map(n => n.id === id ? {...n, ...data} : n);
  writeNotes(all);
  renderBoard();
  renderDeliveriesPreview();
}
function deleteNoteById(id) {
  const all = readNotes().filter(n => n.id !== id);
  writeNotes(all);
  renderBoard();
  renderDeliveriesPreview();
}

/* ========== RENDER Agenda ========= */
function renderAgenda() {
  const items = readAgenda().sort((a,b)=> (a.date||"").localeCompare(b.date||""));
  const activeFilter = document.querySelector(".filter.is-active")?.dataset.filter || "todos";
  const q = (searchInput.value || "").toLowerCase().trim();

  agendaEl.innerHTML = "";
  items.forEach(it => {
    // filter by search (title + desc)
    const textLower = (it.title + " " + (it.desc||"")).toLowerCase();
    const matchText = !q || textLower.includes(q);
    // no per-discipline filter here; show all
    if (!matchText) return;

    const row = document.createElement("div");
    row.className = "agenda__row";
    row.innerHTML = `
      <span class="agenda__date">${formatDateForDisplay(it.date)}</span>
      <span class="agenda__title">${it.title}</span>
      <span class="agenda__status badgeOk">${it.type}</span>
    `;

    if (isAdmin()) {
      const actions = document.createElement("div");
      actions.style.gridColumn = "1 / -1";
      actions.style.display = "flex";
      actions.style.gap = "8px";
      actions.style.marginTop = "8px";
      actions.innerHTML = `
        <button class="btn btn--ghost" data-action="edit-ag" data-id="${it.id}">Editar</button>
        <button class="btn" data-action="del-ag" data-id="${it.id}">Excluir</button>
      `;
      row.appendChild(actions);
    }

    agendaEl.appendChild(row);
  });

  // bind admin actions
  if (isAdmin()) {
    document.querySelectorAll('[data-action="edit-ag"]').forEach(btn => {
      btn.addEventListener("click", () => {
        openEditor("agenda-edit", btn.dataset.id);
      });
    });
    document.querySelectorAll('[data-action="del-ag"]').forEach(btn => {
      btn.addEventListener("click", () => {
        if (confirm("Excluir este item da agenda?")) {
          deleteAgendaById(btn.dataset.id);
        }
      });
    });
  }
}

/* Agenda CRUD */
function addAgenda(item) {
  const all = readAgenda();
  all.unshift(item);
  writeAgenda(all);
  renderAgenda();
  renderDeliveriesPreview();
}
function updateAgenda(id, data) {
  const all = readAgenda().map(a => a.id === id ? {...a, ...data} : a);
  writeAgenda(all);
  renderAgenda();
  renderDeliveriesPreview();
}
function deleteAgendaById(id) {
  const all = readAgenda().filter(a => a.id !== id);
  writeAgenda(all);
  renderAgenda();
  renderDeliveriesPreview();
}

/* ========== Deliveries preview (hero) ========= */
function renderDeliveriesPreview() {
  const notes = readNotes().slice(0,4);
  const agenda = readAgenda().slice(0,4);
  // combine by date ascending
  const combined = [...notes.map(n=>({type:"note", date:n.date, title:n.title})),
                    ...agenda.map(a=>({type:"agenda", date:a.date, title:a.title}))];
  combined.sort((a,b)=> (a.date||"").localeCompare(b.date||""));

  deliveriesPreview.innerHTML = "";
  combined.slice(0,4).forEach(item => {
    const el = document.createElement("div");
    el.className = "delivery";
    el.innerHTML = `<div class="delivery__left"><span class="delivery__date">${formatDateForDisplay(item.date)}</span><span class="delivery__title">${item.title}</span></div><span class="delivery__tag">${item.type === "note" ? "Aviso" : "Agenda"}</span>`;
    deliveriesPreview.appendChild(el);
  });
}

/* ========== Editor modal ========= */
function openEditor(mode, editId=null) {
  if (!isAdmin()) {
    alert("Somente admin pode editar.");
    return;
  }
  editorMode = mode;
  editorEditId = editId;
  // reset fields
  noteTitle.value = ""; noteCat.value = "gestao"; noteDate.value = ""; notePriority.value="normal"; noteText.value = "";
  agendaDate.value = ""; agendaTitle.value = ""; agendaDesc.value = ""; agendaType.value = "prazo";

  // switch UI
  if (mode.startsWith("note")) {
    noteEditor.classList.remove("hidden");
    agendaEditor.classList.add("hidden");
    editorTitle.textContent = mode === "note-add" ? "Adicionar aviso" : "Editar aviso";
    if (mode === "note-edit" && editId) {
      const note = readNotes().find(n => n.id === editId);
      if (note) {
        noteTitle.value = note.title;
        noteCat.value = note.cat;
        noteDate.value = note.date || "";
        notePriority.value = note.priority || "normal";
        noteText.value = note.text || "";
      }
    }
  } else {
    // agenda editor
    noteEditor.classList.add("hidden");
    agendaEditor.classList.remove("hidden");
    editorTitle.textContent = mode === "agenda-add" ? "Adicionar item da agenda" : "Editar item da agenda";
    if (mode === "agenda-edit" && editId) {
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
function closeEditorModal() {
  editorModal.classList.add("hidden");
  editorMode = null; editorEditId = null;
}
function saveEditor() {
  if (!isAdmin()) { alert("Somente admin."); closeEditorModal(); return; }
  if (editorMode === "note-add") {
    const newNote = {
      id: genId(),
      cat: noteCat.value,
      title: noteTitle.value || "(sem título)",
      date: noteDate.value || "",
      priority: notePriority.value || "normal",
      text: noteText.value || ""
    };
    addNote(newNote);
    showToast("Aviso adicionado.");
  } else if (editorMode === "note-edit" && editorEditId) {
    updateNote(editorEditId, {
      title: noteTitle.value,
      cat: noteCat.value,
      date: noteDate.value,
      priority: notePriority.value,
      text: noteText.value
    });
    showToast("Aviso atualizado.");
  } else if (editorMode === "agenda-add") {
    const it = {
      id: genId(),
      date: agendaDate.value || "",
      title: agendaTitle.value || "(sem título)",
      desc: agendaDesc.value || "",
      type: agendaType.value || "prazo"
    };
    addAgenda(it);
    showToast("Item de agenda adicionado.");
  } else if (editorMode === "agenda-edit" && editorEditId) {
    updateAgenda(editorEditId, {
      date: agendaDate.value,
      title: agendaTitle.value,
      desc: agendaDesc.value,
      type: agendaType.value
    });
    showToast("Agenda atualizada.");
  }
  closeEditorModal();
  renderBoard();
  renderAgenda();
  renderDeliveriesPreview();
}

/* ========== Filters & Search ========= */
function applyFilters() {
  renderBoard();
  renderAgenda();
  renderDeliveriesPreview();
}

/* ========== small utils ========= */
function catLabel(code) {
  const map = {gestao:"Gestão de Projetos", ti:"Governança de TI", web:"Programação Web II", si:"Sistemas de Informação", es:"Engenharia de Software II", log:"Informática Aplicada à Logística"};
  return map[code] || code;
}
function formatDateForDisplay(iso) {
  if (!iso) return "—";
  // support yyyy-mm-dd
  const parts = iso.split("-");
  if (parts.length === 3) return `${parts[2]}/${parts[1]}`;
  return iso;
}

/* ========== Toaster (feedback simples) ========= */
function showToast(msg, isError=false) {
  // simple alert replacement (you can replace with fancier toast)
  if (isError) alert(msg);
  else {
    // small unobtrusive message element
    const el = document.createElement("div");
    el.textContent = msg;
    el.style.position = "fixed";
    el.style.right = "18px";
    el.style.bottom = "18px";
    el.style.padding = "10px 14px";
    el.style.borderRadius = "10px";
    el.style.background = isError ? "rgba(255,80,80,.95)" : "rgba(20,120,240,.95)";
    el.style.color = "#fff";
    el.style.zIndex = 99999;
    document.body.appendChild(el);
    setTimeout(()=> el.remove(), 2200);
  }
}

/* ========== INIT ======== */
init();
