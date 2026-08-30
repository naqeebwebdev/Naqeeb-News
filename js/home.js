// ==========================================================================
// NAQEEB NEWS — HOME PAGE SCRIPT
// Fetches latest news, populates hero spotlight, side highlights & latest news grid
// ==========================================================================

import {
  fetchAllNews,
  createNewsCardHtml,
  getCategoryBadgeHtml,
  formatDate,
  escapeHtml
} from "./common.js";

async function initHomePage() {
  const heroContainer = document.getElementById("hero-container");
  const latestGrid = document.getElementById("latest-news-grid");
  const tickerContent = document.getElementById("ticker-content");

  try {
    const articles = await fetchAllNews();

    if (!articles || articles.length === 0) {
      if (heroContainer) heroContainer.style.display = "none";
      if (latestGrid) {
        latestGrid.innerHTML = `
          <div class="state-box" style="grid-column: 1 / -1;">
            <div class="state-icon">📰</div>
            <h3 class="state-title">No News Available</h3>
            <p class="state-desc">No news articles have been published yet. Check back soon or visit the Admin Panel to publish the first story.</p>
          </div>
        `;
      }
      return;
    }

    // Set Breaking Ticker
    if (tickerContent && articles[0]) {
      tickerContent.innerHTML = `
        <a href="news-detail.html?id=${encodeURIComponent(articles[0].id)}" style="color: inherit; text-decoration: none;">
          ${escapeHtml(articles[0].title)}
        </a>
      `;
    }

    // Render Featured Hero Section (Top 1 Lead + Next 3 Side Highlights)
    if (heroContainer) {
      const mainHero = articles[0];
      const sideHeroes = articles.slice(1, 4);

      const mainHeroImg = mainHero.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80";
      const mainHeroBadge = getCategoryBadgeHtml(mainHero.category);
      const mainHeroDate = formatDate(mainHero.date || mainHero.createdAt);

      let sideListHtml = "";
      sideHeroes.forEach(sideItem => {
        const sideImg = sideItem.imageUrl || "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80";
        const sideDate = formatDate(sideItem.date || sideItem.createdAt);
        const sideBadge = getCategoryBadgeHtml(sideItem.category);

        sideListHtml += `
          <div class="side-news-card">
            <img src="${escapeHtml(sideImg)}" alt="${escapeHtml(sideItem.title)}" class="side-news-img" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80'">
            <div class="side-news-info">
              <div>
                <div style="margin-bottom: 0.25rem;">${sideBadge} <span style="font-size: 0.75rem; color: var(--text-muted); margin-left: 0.35rem;">${escapeHtml(sideDate)}</span></div>
                <h4 class="side-news-title">
                  <a href="news-detail.html?id=${encodeURIComponent(sideItem.id)}">${escapeHtml(sideItem.title)}</a>
                </h4>
              </div>
              <a href="news-detail.html?id=${encodeURIComponent(sideItem.id)}" style="font-size: 0.75rem; color: var(--primary); font-weight: 600; margin-top: 0.35rem;">Read Story →</a>
            </div>
          </div>
        `;
      });

      heroContainer.innerHTML = `
        <div class="hero-grid">
          <div class="hero-main-card">
            <div class="hero-img-box">
              <a href="news-detail.html?id=${encodeURIComponent(mainHero.id)}">
                <img src="${escapeHtml(mainHeroImg)}" alt="${escapeHtml(mainHero.title)}" onerror="this.src='https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80'">
              </a>
            </div>
            <div class="hero-content">
              <div class="hero-meta">
                ${mainHeroBadge}
                <span>•</span>
                <span>${escapeHtml(mainHeroDate)}</span>
                <span>•</span>
                <span>By ${escapeHtml(mainHero.author || "Naqeeb Desk")}</span>
              </div>
              <h2 class="hero-title">
                <a href="news-detail.html?id=${encodeURIComponent(mainHero.id)}">${escapeHtml(mainHero.title)}</a>
              </h2>
              <p class="hero-desc">${escapeHtml(mainHero.description)}</p>
              <div style="margin-top: auto;">
                <a href="news-detail.html?id=${encodeURIComponent(mainHero.id)}" class="btn btn-primary">Read Full Story →</a>
              </div>
            </div>
          </div>
          <div class="hero-side-list">
            <h3 style="font-family: var(--font-heading); font-size: 1.125rem; font-weight: 800; color: var(--secondary); margin-bottom: 0.25rem;">Top Highlights</h3>
            ${sideListHtml || "<p style='color: var(--text-muted); font-size: 0.875rem;'>No more highlights.</p>"}
          </div>
        </div>
      `;
    }

    // Render Latest Stories Grid
    if (latestGrid) {
      const gridArticles = articles.length > 4 ? articles.slice(4, 10) : articles;
      if (gridArticles.length === 0) {
        latestGrid.innerHTML = `
          <div class="state-box" style="grid-column: 1 / -1;">
            <p class="state-desc">All current stories are featured in the spotlight above.</p>
          </div>
        `;
      } else {
        latestGrid.innerHTML = gridArticles.map(createNewsCardHtml).join("");
      }
    }

    // Helper to populate category grids
    const populateCategoryGrid = (elementId, categoryName, maxItems = 4) => {
      const el = document.getElementById(elementId);
      if (!el) return;
      const catArticles = articles
        .filter(a => (a.category || "").toLowerCase() === categoryName.toLowerCase())
        .slice(0, maxItems);
      
      if (catArticles.length > 0) {
        el.innerHTML = catArticles.map(createNewsCardHtml).join("");
      } else {
        el.innerHTML = `<div class="state-box" style="grid-column: 1 / -1;"><p class="state-desc">No ${categoryName} stories currently available.</p></div>`;
      }
    };

    populateCategoryGrid("pakistan-news-grid", "Pakistan", 4);
    populateCategoryGrid("world-news-grid", "World", 4);
    populateCategoryGrid("sports-news-grid", "Sports", 2);
    populateCategoryGrid("tech-news-grid", "Technology", 2);
    populateCategoryGrid("business-news-grid", "Business", 2);
    populateCategoryGrid("entertainment-news-grid", "Entertainment", 2);
  } catch (error) {
    console.error("Error loading home news:", error);
    if (latestGrid) {
      latestGrid.innerHTML = `
        <div class="state-box" style="grid-column: 1 / -1;">
          <div class="state-icon">⚠️</div>
          <h3 class="state-title">Unable to load news</h3>
          <p class="state-desc">There was an issue fetching the latest stories. Please check your connection or try again.</p>
        </div>
      `;
    }
  }
}

document.addEventListener("DOMContentLoaded", initHomePage);
