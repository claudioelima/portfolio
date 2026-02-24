// ===== Ano automático no rodapé
document.getElementById("ano").textContent = new Date().getFullYear();

// ===== Menu mobile
const btnMenu = document.getElementById("btnMenu");
const menuLinks = document.getElementById("menuLinks");

btnMenu?.addEventListener("click", () => {
  const isOpen = menuLinks.classList.toggle("is-open");
  btnMenu.setAttribute("aria-expanded", String(isOpen));
});

// Fecha menu ao clicar em um link (mobile)
menuLinks?.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    menuLinks.classList.remove("is-open");
    btnMenu.setAttribute("aria-expanded", "false");
  }
});

// ===== Tema (dark/light) com memória
const btnTheme = document.getElementById("btnTheme");
const savedTheme = localStorage.getItem("theme");
if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);

btnTheme?.addEventListener("click", () => {
  const current = document.documentElement.getAttribute("data-theme");
  const next = current === "light" ? "" : "light";
  if (next) document.documentElement.setAttribute("data-theme", next);
  else document.documentElement.removeAttribute("data-theme");
  localStorage.setItem("theme", next || "dark");
});

// ===== Filtro de projetos
const filters = document.querySelectorAll(".filter");
const projects = document.querySelectorAll(".project");

filters.forEach((btn) => {
  btn.addEventListener("click", () => {
    filters.forEach((b) => b.classList.remove("is-active"));
    btn.classList.add("is-active");

    const filter = btn.dataset.filter;
    projects.forEach((card) => {
      const cat = card.dataset.cat;
      const show = filter === "todos" || cat === filter;
      card.style.display = show ? "block" : "none";
    });
  });
});

// ===== Contador animado (stats)
function animateCounter(el, to) {
  const duration = 850;
  const start = performance.now();
  const from = 0;

  function tick(now) {
    const t = Math.min((now - start) / duration, 1);
    const value = Math.floor(from + (to - from) * t);
    el.textContent = value;
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

const counters = document.querySelectorAll("[data-counter]");
const observer = new IntersectionObserver((entries, obs) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      const el = entry.target;
      const to = Number(el.getAttribute("data-counter")) || 0;
      animateCounter(el, to);
      obs.unobserve(el);
    }
  });
}, { threshold: 0.4 });

counters.forEach((el) => observer.observe(el));

// ===== Formulário (simulação)
const form = document.getElementById("contactForm");
const formMsg = document.getElementById("formMsg");

form?.addEventListener("submit", (e) => {
  e.preventDefault();
  formMsg.textContent = "Mensagem enviada (simulação). Configure um serviço de formulário se quiser envio real.";
  form.reset();
});
