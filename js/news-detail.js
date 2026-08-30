// ==========================================================================
// NAQEEB NEWS — SINGLE ARTICLE DETAIL SCRIPT
// Fetches document by ID from URL params and renders full story view
// ==========================================================================

import {
  fetchNewsById,
  fetchNewsByCategory,
  createNewsCardHtml,
  getCategoryBadgeHtml,
  formatDate,
  escapeHtml
} from "./common.js";

async function initNewsDetailPage() {
  const container = document.getElementById("article-content");
  const relatedContainer = document.getElementById("related-news-grid");
  const urlParams = new URLSearchParams(window.location.search);
  const articleId = urlParams.get("id");

  if (!articleId) {
    if (container) {
      container.innerHTML = `
        <div class="state-box">
          <div class="state-icon">⚠️</div>
          <h2 class="state-title">Article Not Specified</h2>
          <p class="state-desc">No news article ID was provided in the link. Please choose an article from the homepage or category pages.</p>
          <a href="index.html" class="btn btn-primary">Go to Homepage</a>
        </div>
      `;
    }
    return;
  }

  try {
    const article = await fetchNewsById(articleId);

    if (!article) {
      if (container) {
        container.innerHTML = `
          <div class="state-box">
            <div class="state-icon">❌</div>
            <h2 class="state-title">Article Not Found</h2>
            <p class="state-desc">The requested article could not be located in the database. It may have been removed or updated.</p>
            <a href="index.html" class="btn btn-primary">Return to Homepage</a>
          </div>
        `;
      }
      return;
    }

    // Set page title dynamically
    document.title = `${article.title} — Naqeeb News`;

    const fallbackImg = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80";
    const imgUrl = article.imageUrl || fallbackImg;
    const dateStr = formatDate(article.date || article.createdAt);
    const badgeHtml = getCategoryBadgeHtml(article.category);

    // Format paragraphs
    const paragraphs = (article.description || "")
      .split(/\n+/)
      .map(p => p.trim())
      .filter(p => p.length > 0)
      .map(p => `<p>${escapeHtml(p)}</p>`)
      .join("");

    if (container) {
      container.innerHTML = `
        <div class="article-header">
          <div class="article-category">
            <a href="${escapeHtml((article.category || 'pakistan').toLowerCase())}.html">${badgeHtml}</a>
          </div>
          <h1 class="article-title">${escapeHtml(article.title)}</h1>
          
          <div class="article-meta-bar">
            <div class="article-meta-left">
              <span><strong>Author:</strong> ${escapeHtml(article.author || "Naqeeb Desk")}</span>
              <span>•</span>
              <span><strong>Published:</strong> ${escapeHtml(dateStr)}</span>
            </div>
            <div>
              <span style="font-size: 0.8125rem; color: var(--text-muted);">ID: ${escapeHtml(article.id)}</span>
            </div>
          </div>
        </div>

        <div class="article-image-box">
          <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(article.title)}" onerror="this.src='${fallbackImg}'">
        </div>

        <div class="article-body">
          ${paragraphs || `<p>${escapeHtml(article.description)}</p>`}
        </div>

        <div class="article-actions">
          <a href="javascript:history.back()" class="btn btn-outline">← Back to Previous Page</a>
          <a href="index.html" class="btn btn-secondary">All News Stories</a>
        </div>
      `;
    }

    // Fetch and render related news from same category
    if (relatedContainer && article.category) {
      const categoryItems = await fetchNewsByCategory(article.category);
      const related = categoryItems.filter(item => item.id !== article.id).slice(0, 3);
      
      if (related.length > 0) {
        relatedContainer.innerHTML = related.map(createNewsCardHtml).join("");
      } else {
        const relatedSection = document.getElementById("related-section");
        if (relatedSection) relatedSection.style.display = "none";
      }
    }
  } catch (error) {
    console.error("Error loading article:", error);
    if (container) {
      container.innerHTML = `
        <div class="state-box">
          <div class="state-icon">⚠️</div>
          <h2 class="state-title">Error Loading Article</h2>
          <p class="state-desc">Unable to retrieve article details. Please check your internet connection.</p>
          <a href="index.html" class="btn btn-primary">Return to Homepage</a>
        </div>
      `;
    }
  }
}

document.addEventListener("DOMContentLoaded", initNewsDetailPage);
