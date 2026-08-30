// ==========================================================================
// NAQEEB NEWS — COMMON UTILITIES & SHARED LOGIC
// Reusable navigation, date formatting, badge generation, toasts & data fetchers
// ==========================================================================

import {
  db,
  collection,
  getDocs,
  getDoc,
  doc,
  query,
  where,
  orderBy,
  limit,
  handleFirestoreError,
  STARTER_NEWS
} from "./firebase.js";
import { isFirebaseConfigured } from "./firebase-config.js";

/**
 * Escapes HTML characters to prevent XSS attacks
 */
export function escapeHtml(str) {
  if (!str) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Formats date into readable string (e.g. "Aug 30, 2026")
 */
export function formatDate(dateInput) {
  if (!dateInput) return "Recently";
  try {
    let d;
    if (dateInput.toDate && typeof dateInput.toDate === "function") {
      d = dateInput.toDate();
    } else if (dateInput.seconds) {
      d = new Date(dateInput.seconds * 1000);
    } else {
      d = new Date(dateInput);
    }
    if (isNaN(d.getTime())) return "Recently";
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric"
    });
  } catch (e) {
    return "Recently";
  }
}

/**
 * Returns HTML badge element for a given category
 */
export function getCategoryBadgeHtml(category) {
  const cat = (category || "").toLowerCase();
  let badgeClass = "badge-default";
  if (cat === "pakistan") badgeClass = "badge-pakistan";
  else if (cat === "world") badgeClass = "badge-world";
  else if (cat === "sports") badgeClass = "badge-sports";
  else if (cat === "technology") badgeClass = "badge-technology";
  else if (cat === "business") badgeClass = "badge-business";
  else if (cat === "entertainment") badgeClass = "badge-entertainment";

  return `<span class="badge ${badgeClass}">${escapeHtml(category || "General")}</span>`;
}

/**
 * Displays a toast notification on bottom-right of screen
 */
export function showToast(message, type = "info") {
  let container = document.getElementById("toast-container");
  if (!container) {
    container = document.createElement("div");
    container.id = "toast-container";
    container.className = "toast-container";
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.innerHTML = `
    <span>${type === "success" ? "✓" : type === "error" ? "⚠" : "ℹ"}</span>
    <span>${escapeHtml(message)}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(10px)";
    toast.style.transition = "all 0.3s ease";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

/**
 * Injects current date into top bar
 */
export function initTopDate() {
  const dateEl = document.getElementById("current-date");
  if (dateEl) {
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }
}

/**
 * Initializes mobile hamburger menu toggle
 */
export function initMobileMenu() {
  const menuBtn = document.getElementById("mobile-menu-btn");
  const navLinks = document.getElementById("nav-links");
  if (menuBtn && navLinks) {
    menuBtn.addEventListener("click", () => {
      navLinks.classList.toggle("mobile-open");
      const isOpen = navLinks.classList.contains("mobile-open");
      menuBtn.setAttribute("aria-expanded", isOpen);
      menuBtn.textContent = isOpen ? "✕" : "☰";
    });
  }
}

/**
 * Handles header search form submission
 */
export function initHeaderSearch() {
  const searchForms = document.querySelectorAll(".header-search-form");
  searchForms.forEach(form => {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = form.querySelector("input[name='q']");
      if (input && input.value.trim()) {
        window.location.href = `search.html?q=${encodeURIComponent(input.value.trim())}`;
      }
    });
  });
}

/**
 * Fetches all news from Firestore or returns stored starter articles if Firestore is empty
 */
export function getLocalCachedNews() {
  try {
    const stored = localStorage.getItem("naqeeb_news_local_cache");
    if (stored) {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed) && parsed.length >= STARTER_NEWS.length) {
        return parsed;
      }
    }
  } catch (e) {}
  return [...STARTER_NEWS];
}

export function saveLocalCachedNews(newsList) {
  try {
    localStorage.setItem("naqeeb_news_local_cache", JSON.stringify(newsList));
  } catch (e) {}
}

/**
 * Unified data fetcher for articles
 */
export async function fetchAllNews() {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const items = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (items.length > 0) {
        saveLocalCachedNews(items);
        return items;
      }
    } catch (err) {
      handleFirestoreError(err, "list", "news");
    }
  }
  // Fallback to local cache / sample articles
  return getLocalCachedNews();
}

/**
 * Fetches news by category
 */
export async function fetchNewsByCategory(category) {
  if (isFirebaseConfigured() && db) {
    try {
      const q = query(
        collection(db, "news"),
        where("category", "==", category)
      );
      const snapshot = await getDocs(q);
      const items = [];
      snapshot.forEach(docSnap => {
        items.push({ id: docSnap.id, ...docSnap.data() });
      });
      if (items.length > 0) {
        return items;
      }
    } catch (err) {
      handleFirestoreError(err, "list", `news[category=${category}]`);
    }
  }
  // Filter from cached news
  const all = getLocalCachedNews();
  return all.filter(item => (item.category || "").toLowerCase() === category.toLowerCase());
}

/**
 * Fetches a single news article by document ID
 */
export async function fetchNewsById(id) {
  if (!id) return null;
  if (isFirebaseConfigured() && db) {
    try {
      const docRef = doc(db, "news", id);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (err) {
      handleFirestoreError(err, "get", `news/${id}`);
    }
  }
  const all = getLocalCachedNews();
  return all.find(item => item.id === id) || null;
}

/**
 * Creates standard HTML for a news card
 */
export function createNewsCardHtml(item) {
  const fallbackImg = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80";
  const imgUrl = item.imageUrl || fallbackImg;
  const dateStr = formatDate(item.date || item.createdAt);
  const badgeHtml = getCategoryBadgeHtml(item.category);

  return `
    <article class="news-card" id="news-card-${escapeHtml(item.id)}">
      <div class="news-card-img-wrap">
        <a href="news-detail.html?id=${encodeURIComponent(item.id)}" aria-label="${escapeHtml(item.title)}">
          <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.title)}" loading="lazy" onerror="this.src='${fallbackImg}'">
        </a>
      </div>
      <div class="news-card-body">
        <div class="news-card-meta">
          ${badgeHtml}
          <span>${escapeHtml(dateStr)}</span>
        </div>
        <h3 class="news-card-title">
          <a href="news-detail.html?id=${encodeURIComponent(item.id)}">${escapeHtml(item.title)}</a>
        </h3>
        <p class="news-card-desc">${escapeHtml(item.description)}</p>
        <div class="news-card-footer">
          <span class="news-author">By ${escapeHtml(item.author || "Naqeeb Desk")}</span>
          <a href="news-detail.html?id=${encodeURIComponent(item.id)}" class="btn btn-outline btn-sm">Read More →</a>
        </div>
      </div>
    </article>
  `;
}

// Global initialization on DOM load
document.addEventListener("DOMContentLoaded", () => {
  initTopDate();
  initMobileMenu();
  initHeaderSearch();
});
