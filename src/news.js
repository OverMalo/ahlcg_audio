// ── News Modal ────────────────────────────────────────────────────────────
// Muestra un banner modal con las novedades. Guarda en localStorage la versión
// vista; si la versión del JSON es mayor, vuelve a mostrar el modal.

import { getContent } from "./i18n.js";

const STORAGE_KEY = "ahlcg_audio:news_seen";

function getSeenVersion() {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
}

function markSeen(version) {
  try {
    localStorage.setItem(STORAGE_KEY, String(version));
  } catch {}
}

export function initNewsModal() {
  const news = getContent().news;
  if (!news || !news.version || !news.items?.length) return;

  if (getSeenVersion() >= news.version) return;

  const overlay = document.createElement("div");
  overlay.className = "news-overlay";
  overlay.setAttribute("data-visible", "true");
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");
  overlay.setAttribute("aria-label", news.title || "Novedades");

  const modal = document.createElement("div");
  modal.className = "news-modal";

  const title = document.createElement("h2");
  title.className = "news-modal-title";
  title.textContent = news.title || "Novedades";

  const list = document.createElement("ul");
  list.className = "news-modal-list";
  for (const item of news.items) {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  }

  const btn = document.createElement("button");
  btn.className = "news-modal-close";
  btn.textContent = news.closeBtnLabel || "Cerrar";

  modal.append(title, list, btn);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  const close = () => {
    overlay.setAttribute("data-visible", "false");
    markSeen(news.version);
    overlay.addEventListener("transitionend", () => overlay.remove(), { once: true });
  };

  btn.addEventListener("click", close);
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) close();
  });
  document.addEventListener("keydown", function handler(e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", handler);
    }
  });

  btn.focus();
}
