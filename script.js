// Ano no rodapé
document.getElementById("ano").textContent = new Date().getFullYear();

// Tema (dark/light) com memória
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

// Menu mobile
const btnMenu = document.getElementById("btnMenu");
const menuLinks = document.getElementById("menuLinks");

btnMenu.addEventListener("click", () => {
  const open = menuLinks.classList.toggle("is-open");
  btnMenu.setAttribute("aria-expanded", String(open));
});

// Contadores (stats)
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

// ====== Mural: concluir avisos
document.querySelectorAll('[data-action="toggle"]').forEach(btn => {
  btn.addEventListener("click", () => {
    const note = btn.closest(".note");
    note.classList.toggle("is-done");
    btn.textContent = note.classList.contains("is-done")
      ? "Concluído ✅ (desfazer)"
      : "Marcar como concluído";
  });
});

// ====== Filtro por disciplina (avisos) + Busca geral
const filterBtns = document.querySelectorAll(".filter");
const notes = document.querySelectorAll(".note");

function applyFilters() {
  const activeFilter = document.querySelector(".filter.is-active")?.dataset.filter || "todos";
  const q = (document.getElementById("searchInput").value || "").toLowerCase().trim();

  // Filtrar avisos
  notes.forEach(note => {
    const cat = note.dataset.cat;
    const text = (note.dataset.text || note.textContent || "").toLowerCase();
    const byCat = (activeFilter === "todos" || cat === activeFilter);
    const byText = (!q || text.includes(q));
    note.style.display = (byCat && byText) ? "block" : "none";
  });

  // Filtrar disciplinas (cards)
  document.querySelectorAll(".cardDisc").forEach(card => {
    const name = (card.dataset.name || "").toLowerCase();
    const tag = (card.dataset.tag || "").toLowerCase();
    const byText = (!q || name.includes(q) || tag.includes(q));
    card.style.display = byText ? "block" : "none";
  });
}

filterBtns.forEach(btn => {
  btn.addEventListener("click", () => {
    filterBtns.forEach(b => b.classList.remove("is-active"));
    btn.classList.add("is-active");
    applyFilters();
  });
});

// Busca (topo)
document.getElementById("searchInput").addEventListener("input", applyFilters);

// Primeira aplicação
applyFilters();
