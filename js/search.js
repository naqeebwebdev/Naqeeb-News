// ==========================================================================
// NAQEEB NEWS — SEARCH MODULE
// Reads search query, filters Firestore articles on client side & renders results
// ==========================================================================

import {
  fetchAllNews,
  createNewsCardHtml,
  escapeHtml
} from "./common.js";

async function initSearchPage() {
  const searchInput = document.getElementById("search-page-input");
  const searchForm = document.getElementById("search-page-form");
  const resultsGrid = document.getElementById("search-results-grid");
  const querySummary = document.getElementById("search-query-summary");
  const resultCountBadge = document.getElementById("search-count-badge");

  const urlParams = new URLSearchParams(window.location.search);
  const initialQuery = (urlParams.get("q") || "").trim();

  if (searchInput && initialQuery) {
    searchInput.value = initialQuery;
  }

  async function performSearch(keyword) {
    if (!resultsGrid) return;
    const cleanKeyword = keyword.trim().toLowerCase();

    if (!cleanKeyword) {
      if (querySummary) querySummary.textContent = "Please enter a search keyword above";
      if (resultCountBadge) resultCountBadge.textContent = "0 Results";
      resultsGrid.innerHTML = `
        <div class="state-box" style="grid-column: 1 / -1;">
          <div class="state-icon">🔍</div>
          <h3 class="state-title">Search Naqeeb News</h3>
          <p class="state-desc">Type a title or keyword in the box above to find matching news stories across all categories.</p>
        </div>
      `;
      return;
    }

    resultsGrid.innerHTML = `
      <div class="state-box" style="grid-column: 1 / -1;">
        <div class="spinner"></div>
        <p class="state-desc">Searching news articles...</p>
      </div>
    `;

    try {
      const allArticles = await fetchAllNews();
      
      // Client-side search filtering (by title, description, category, and author)
      const matching = allArticles.filter(item => {
        const titleMatch = (item.title || "").toLowerCase().includes(cleanKeyword);
        const descMatch = (item.description || "").toLowerCase().includes(cleanKeyword);
        const catMatch = (item.category || "").toLowerCase().includes(cleanKeyword);
        const authorMatch = (item.author || "").toLowerCase().includes(cleanKeyword);
        return titleMatch || descMatch || catMatch || authorMatch;
      });

      if (querySummary) {
        querySummary.innerHTML = `Showing results for: <strong>"${escapeHtml(keyword)}"</strong>`;
      }
      if (resultCountBadge) {
        resultCountBadge.textContent = `${matching.length} ${matching.length === 1 ? "Result" : "Results"}`;
      }

      if (matching.length === 0) {
        resultsGrid.innerHTML = `
          <div class="state-box" style="grid-column: 1 / -1;">
            <div class="state-icon">🔎</div>
            <h3 class="state-title">No News Found</h3>
            <p class="state-desc">No articles matched your search query "${escapeHtml(keyword)}". Try searching with different or simpler keywords.</p>
            <a href="index.html" class="btn btn-primary">Browse All News</a>
          </div>
        `;
      } else {
        resultsGrid.innerHTML = matching.map(createNewsCardHtml).join("");
      }
    } catch (error) {
      console.error("Search error:", error);
      resultsGrid.innerHTML = `
        <div class="state-box" style="grid-column: 1 / -1;">
          <div class="state-icon">⚠️</div>
          <h3 class="state-title">Search Error</h3>
          <p class="state-desc">Unable to complete search request. Please try again.</p>
        </div>
      `;
    }
  }

  if (searchForm) {
    searchForm.addEventListener("submit", (e) => {
      e.preventDefault();
      const val = searchInput?.value || "";
      // Update URL without reload
      const newUrl = `${window.location.pathname}?q=${encodeURIComponent(val.trim())}`;
      window.history.pushState({ path: newUrl }, "", newUrl);
      performSearch(val);
    });
  }

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      if (e.target.value.trim().length === 0) {
        performSearch("");
      }
    });
  }

  // Initial search execution
  if (initialQuery) {
    performSearch(initialQuery);
  } else {
    performSearch("");
  }
}

document.addEventListener("DOMContentLoaded", initSearchPage);
