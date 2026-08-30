// ==========================================================================
// NAQEEB NEWS — CATEGORY PAGE SCRIPT
// Reusable script for Pakistan, World, Sports, Tech, Business & Entertainment pages
// ==========================================================================

import {
  fetchNewsByCategory,
  createNewsCardHtml,
  escapeHtml
} from "./common.js";

async function initCategoryPage() {
  const categoryName = document.body.getAttribute("data-category") || "General";
  const gridContainer = document.getElementById("category-news-grid");
  const countBadge = document.getElementById("category-count");
  const categoryTitleEl = document.getElementById("category-title");

  if (categoryTitleEl) {
    categoryTitleEl.textContent = `${categoryName} News`;
  }

  try {
    const articles = await fetchNewsByCategory(categoryName);

    if (countBadge) {
      countBadge.textContent = `${articles.length} ${articles.length === 1 ? "Article" : "Articles"}`;
    }

    if (!articles || articles.length === 0) {
      if (gridContainer) {
        gridContainer.innerHTML = `
          <div class="state-box" style="grid-column: 1 / -1;">
            <div class="state-icon">📂</div>
            <h3 class="state-title">No ${escapeHtml(categoryName)} News Found</h3>
            <p class="state-desc">There are currently no published stories under the ${escapeHtml(categoryName)} category. Check back later or browse other categories.</p>
            <a href="index.html" class="btn btn-primary" style="margin-top: 0.5rem;">Browse All News</a>
          </div>
        `;
      }
      return;
    }

    if (gridContainer) {
      gridContainer.innerHTML = articles.map(createNewsCardHtml).join("");
    }
  } catch (error) {
    console.error(`Error loading category [${categoryName}] news:`, error);
    if (gridContainer) {
      gridContainer.innerHTML = `
        <div class="state-box" style="grid-column: 1 / -1;">
          <div class="state-icon">⚠️</div>
          <h3 class="state-title">Unable to load news</h3>
          <p class="state-desc">Could not load ${escapeHtml(categoryName)} news. Please try refreshing the page.</p>
        </div>
      `;
    }
  }
}

document.addEventListener("DOMContentLoaded", initCategoryPage);
