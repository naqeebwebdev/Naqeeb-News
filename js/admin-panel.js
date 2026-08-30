// ==========================================================================
// NAQEEB NEWS — ADMIN DASHBOARD CONTROLLER
// Complete Admin CRUD: Add, Edit, Delete, Image Upload to Storage & Auth Guard
// ==========================================================================

import {
  db,
  auth,
  storage,
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  Timestamp,
  signOut,
  onAuthStateChanged,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject,
  handleFirestoreError,
  STARTER_NEWS
} from "./firebase.js";
import { isFirebaseConfigured } from "./firebase-config.js";
import {
  formatDate,
  getCategoryBadgeHtml,
  showToast,
  escapeHtml,
  getLocalCachedNews,
  saveLocalCachedNews
} from "./common.js";

// State
let allNewsList = [];
let allMessagesList = [];
let currentEditingId = null;
let currentEditingItem = null;

async function initAdminPanel() {
  const adminEmailDisplay = document.getElementById("admin-user-email");
  const logoutBtn = document.getElementById("admin-logout-btn");

  // Auth Guard
  if (isFirebaseConfigured() && auth) {
    onAuthStateChanged(auth, (user) => {
      if (!user) {
        window.location.href = "admin-login.html";
      } else {
        if (adminEmailDisplay) adminEmailDisplay.textContent = user.email || "Admin User";
        loadDashboardData();
      }
    });
  } else {
    // Offline / Demo check
    if (sessionStorage.getItem("naqeeb_admin_authenticated") !== "true") {
      window.location.href = "admin-login.html";
      return;
    }
    if (adminEmailDisplay) {
      adminEmailDisplay.textContent = sessionStorage.getItem("naqeeb_admin_email") || "admin@naqeebnews.com (Demo)";
    }
    loadDashboardData();
  }

  // Logout Handler
  if (logoutBtn) {
    logoutBtn.addEventListener("click", async () => {
      try {
        if (isFirebaseConfigured() && auth) {
          await signOut(auth);
        }
        sessionStorage.removeItem("naqeeb_admin_authenticated");
        sessionStorage.removeItem("naqeeb_admin_email");
        showToast("Signed out successfully", "info");
        window.location.href = "admin-login.html";
      } catch (err) {
        console.error("Logout error:", err);
      }
    });
  }

  // Form & UI Listeners
  initAddNewsForm();
  initEditNewsModal();
  initTabsAndSearch();
  initSeedButton();
}

/**
 * Loads News and Messages for the Admin Dashboard
 */
async function loadDashboardData() {
  await loadAdminNewsList();
  await loadAdminMessagesList();
  updateDashboardStats();
}

/**
 * Fetches and renders all news articles in admin table
 */
async function loadAdminNewsList() {
  const tableBody = document.getElementById("admin-news-table-body");
  if (!tableBody) return;

  tableBody.innerHTML = `
    <tr>
      <td colspan="6" class="state-box" style="border: none; padding: 2rem;">
        <div class="spinner"></div>
        <p class="state-desc">Loading news records...</p>
      </td>
    </tr>
  `;

  try {
    if (isFirebaseConfigured() && db) {
      const q = query(collection(db, "news"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      allNewsList = [];
      snapshot.forEach(docSnap => {
        allNewsList.push({ id: docSnap.id, ...docSnap.data() });
      });
      saveLocalCachedNews(allNewsList);
    } else {
      allNewsList = getLocalCachedNews();
    }

    renderAdminNewsTable(allNewsList);
    updateDashboardStats();
  } catch (error) {
    console.error("Error loading admin news:", error);
    handleFirestoreError(error, "list", "news");
    allNewsList = getLocalCachedNews();
    renderAdminNewsTable(allNewsList);
  }
}

/**
 * Renders news articles into data table
 */
function renderAdminNewsTable(newsItems) {
  const tableBody = document.getElementById("admin-news-table-body");
  if (!tableBody) return;

  if (!newsItems || newsItems.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="6" class="state-box" style="border: none; padding: 2.5rem 1rem;">
          <div class="state-icon">📰</div>
          <h4 class="state-title">No News Published Yet</h4>
          <p class="state-desc">Use the "Add News" form above or the sample data seeder to create your first news story.</p>
        </td>
      </tr>
    `;
    return;
  }

  const fallbackImg = "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80";

  tableBody.innerHTML = newsItems.map(item => {
    const imgUrl = item.imageUrl || fallbackImg;
    const dateStr = formatDate(item.date || item.createdAt);
    const badgeHtml = getCategoryBadgeHtml(item.category);

    return `
      <tr id="row-news-${escapeHtml(item.id)}">
        <td>
          <img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(item.title)}" class="table-thumb" onerror="this.src='${fallbackImg}'">
        </td>
        <td>
          <strong style="color: var(--secondary); display: block; max-width: 280px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">
            ${escapeHtml(item.title)}
          </strong>
          <small style="color: var(--text-muted);">ID: ${escapeHtml(item.id)}</small>
        </td>
        <td>${badgeHtml}</td>
        <td>${escapeHtml(item.author || "Naqeeb Desk")}</td>
        <td>${escapeHtml(dateStr)}</td>
        <td>
          <div class="table-actions">
            <a href="news-detail.html?id=${encodeURIComponent(item.id)}" target="_blank" class="btn btn-outline btn-sm" title="View Published Article">👁</a>
            <button type="button" class="btn btn-secondary btn-sm btn-edit-news" data-id="${escapeHtml(item.id)}" title="Edit Article">✏ Edit</button>
            <button type="button" class="btn btn-danger btn-sm btn-delete-news" data-id="${escapeHtml(item.id)}" title="Delete Article">🗑 Delete</button>
          </div>
        </td>
      </tr>
    `;
  }).join("");

  // Attach Action Button Handlers
  document.querySelectorAll(".btn-edit-news").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      openEditModal(id);
    });
  });

  document.querySelectorAll(".btn-delete-news").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      deleteNewsItem(id);
    });
  });
}

/**
 * Loads contact inquiries in Messages tab
 */
async function loadAdminMessagesList() {
  const container = document.getElementById("admin-messages-container");
  if (!container) return;

  try {
    if (isFirebaseConfigured() && db) {
      const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      allMessagesList = [];
      snapshot.forEach(docSnap => {
        allMessagesList.push({ id: docSnap.id, ...docSnap.data() });
      });
    } else {
      allMessagesList = JSON.parse(localStorage.getItem("naqeeb_news_messages") || "[]");
    }

    if (allMessagesList.length === 0) {
      container.innerHTML = `
        <div class="state-box">
          <div class="state-icon">📬</div>
          <h4 class="state-title">No Inquiries Received</h4>
          <p class="state-desc">Messages submitted by visitors via the Contact page will appear here.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="news-grid">
        ${allMessagesList.map(msg => `
          <div class="form-card" style="padding: 1.25rem;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.5rem;">
              <div>
                <strong style="color: var(--secondary); font-size: 1rem;">${escapeHtml(msg.name)}</strong>
                <div style="font-size: 0.8125rem; color: var(--primary);">${escapeHtml(msg.email)}</div>
              </div>
              <span style="font-size: 0.75rem; color: var(--text-muted);">${formatDate(msg.createdAt)}</span>
            </div>
            <p style="font-size: 0.875rem; color: #475569; background: var(--bg-subtle); padding: 0.75rem; border-radius: var(--radius-sm); white-space: pre-wrap;">${escapeHtml(msg.message)}</p>
          </div>
        `).join("")}
      </div>
    `;
  } catch (e) {
    console.warn("Messages load issue:", e);
  }
}

/**
 * Updates quick overview metric counters
 */
function updateDashboardStats() {
  const totalNewsEl = document.getElementById("stat-total-news");
  const totalMsgsEl = document.getElementById("stat-total-msgs");
  const pakCountEl = document.getElementById("stat-pakistan-news");

  if (totalNewsEl) totalNewsEl.textContent = allNewsList.length;
  if (totalMsgsEl) totalMsgsEl.textContent = allMessagesList.length;
  if (pakCountEl) {
    const pakCount = allNewsList.filter(n => (n.category || "").toLowerCase() === "pakistan").length;
    pakCountEl.textContent = pakCount;
  }
}

/**
 * Validates image file before upload
 */
function validateImageFile(file) {
  if (!file) return { valid: false, message: "Please select an image file." };
  
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, message: "Invalid image format. Allowed formats: JPG, JPEG, PNG, WEBP." };
  }

  const maxSize = 5 * 1024 * 1024; // 5 MB
  if (file.size > maxSize) {
    return { valid: false, message: "Image file is too large. Maximum allowed size is 5MB." };
  }

  return { valid: true };
}

/**
 * Uploads an image file to Firebase Storage
 */
async function uploadImageToStorage(file) {
  const timestamp = Date.now();
  const cleanName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const imagePath = `news-images/${timestamp}_${cleanName}`;

  if (isFirebaseConfigured() && storage) {
    const storageRef = ref(storage, imagePath);
    const snapshot = await uploadBytes(storageRef, file, { contentType: file.type });
    const downloadUrl = await getDownloadURL(snapshot.ref);
    return { imageUrl: downloadUrl, imagePath };
  } else {
    // Return object URL / Base64 fallback for demo environment
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        resolve({ imageUrl: e.target.result, imagePath: "" });
      };
      reader.readAsDataURL(file);
    });
  }
}

/**
 * Initializes Add News Form Submission
 */
function initAddNewsForm() {
  const form = document.getElementById("add-news-form");
  const alertBox = document.getElementById("add-news-alert");
  const submitBtn = document.getElementById("add-news-btn");
  const fileInput = document.getElementById("news-image-file");
  const previewBox = document.getElementById("add-image-preview");

  if (!form) return;

  // File Preview
  if (fileInput && previewBox) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const check = validateImageFile(file);
        if (!check.valid) {
          showToast(check.message, "error");
          fileInput.value = "";
          previewBox.innerHTML = `<span style="font-size: 0.8125rem; color: var(--text-muted);">Invalid image</span>`;
          return;
        }
        const url = URL.createObjectURL(file);
        previewBox.innerHTML = `<img src="${url}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
      } else {
        previewBox.innerHTML = `<span style="font-size: 0.8125rem; color: var(--text-muted);">No image selected</span>`;
      }
    });
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    if (alertBox) alertBox.style.display = "none";

    const title = document.getElementById("news-title")?.value.trim();
    const description = document.getElementById("news-description")?.value.trim();
    const category = document.getElementById("news-category")?.value;
    const author = document.getElementById("news-author")?.value.trim();
    const customDate = document.getElementById("news-date")?.value;
    const file = fileInput?.files[0];

    // Validation
    if (!title || title.length < 3) {
      showToast("Please provide a valid title (min 3 chars).", "error");
      return;
    }
    if (!description || description.length < 10) {
      showToast("Please provide article body text (min 10 chars).", "error");
      return;
    }
    if (!category) {
      showToast("Please choose a news category.", "error");
      return;
    }
    if (!author || author.length < 2) {
      showToast("Please specify the author name.", "error");
      return;
    }
    if (!file) {
      showToast("Please select a news image to upload.", "error");
      return;
    }

    const imgValidation = validateImageFile(file);
    if (!imgValidation.valid) {
      showToast(imgValidation.message, "error");
      return;
    }

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>⏳</span> Uploading Image & Saving News...`;
    }

    try {
      // 1. Upload image to Firebase Storage
      const { imageUrl, imagePath } = await uploadImageToStorage(file);

      // 2. Create document in Firestore
      const articleDate = customDate ? new Date(customDate).toISOString() : new Date().toISOString();

      if (isFirebaseConfigured() && db) {
        await addDoc(collection(db, "news"), {
          title,
          description,
          category,
          author,
          imageUrl,
          imagePath,
          date: Timestamp.fromDate(new Date(articleDate)),
          createdAt: serverTimestamp()
        });
      } else {
        const newLocalItem = {
          id: "local-" + Date.now(),
          title,
          description,
          category,
          author,
          imageUrl,
          imagePath,
          date: articleDate,
          createdAt: new Date().toISOString()
        };
        allNewsList.unshift(newLocalItem);
        saveLocalCachedNews(allNewsList);
      }

      showToast("News article published successfully!", "success");
      form.reset();
      if (previewBox) {
        previewBox.innerHTML = `<span style="font-size: 0.8125rem; color: var(--text-muted);">No image selected</span>`;
      }
      await loadAdminNewsList();
    } catch (error) {
      console.error("Error creating news:", error);
      handleFirestoreError(error, "create", "news");
      showToast("Failed to publish news article. Check console for details.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Publish News Article →`;
      }
    }
  });
}

/**
 * Initializes Edit Modal & Handlers
 */
function initEditNewsModal() {
  const modal = document.getElementById("edit-news-modal");
  const closeBtn = document.getElementById("edit-modal-close");
  const cancelBtn = document.getElementById("edit-modal-cancel");
  const form = document.getElementById("edit-news-form");
  const fileInput = document.getElementById("edit-news-image-file");
  const previewBox = document.getElementById("edit-image-preview");

  function closeModal() {
    if (modal) modal.classList.remove("open");
    currentEditingId = null;
    currentEditingItem = null;
    form?.reset();
  }

  if (closeBtn) closeBtn.addEventListener("click", closeModal);
  if (cancelBtn) cancelBtn.addEventListener("click", closeModal);

  if (fileInput && previewBox) {
    fileInput.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) {
        const check = validateImageFile(file);
        if (!check.valid) {
          showToast(check.message, "error");
          fileInput.value = "";
          return;
        }
        const url = URL.createObjectURL(file);
        previewBox.innerHTML = `<img src="${url}" alt="Preview" style="width: 100%; height: 100%; object-fit: cover;">`;
      }
    });
  }

  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      if (!currentEditingId || !currentEditingItem) return;

      const title = document.getElementById("edit-news-title")?.value.trim();
      const description = document.getElementById("edit-news-description")?.value.trim();
      const category = document.getElementById("edit-news-category")?.value;
      const author = document.getElementById("edit-news-author")?.value.trim();
      const customDate = document.getElementById("edit-news-date")?.value;
      const file = fileInput?.files[0];
      const submitBtn = document.getElementById("edit-news-submit-btn");

      if (!title || !description || !category || !author) {
        showToast("Please fill in all required fields.", "error");
        return;
      }

      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerHTML = `<span>⏳</span> Saving Updates...`;
      }

      try {
        let imageUrl = currentEditingItem.imageUrl;
        let imagePath = currentEditingItem.imagePath || "";

        // If a new image was selected, upload it
        if (file) {
          const imgValidation = validateImageFile(file);
          if (!imgValidation.valid) {
            showToast(imgValidation.message, "error");
            if (submitBtn) {
              submitBtn.disabled = false;
              submitBtn.innerHTML = `Save Changes`;
            }
            return;
          }

          // Upload new image
          const uploadRes = await uploadImageToStorage(file);
          imageUrl = uploadRes.imageUrl;
          
          // Optionally delete old storage image if present
          if (isFirebaseConfigured() && storage && currentEditingItem.imagePath) {
            try {
              await deleteObject(ref(storage, currentEditingItem.imagePath));
            } catch (e) {
              console.warn("Previous image deletion skipped:", e);
            }
          }
          imagePath = uploadRes.imagePath;
        }

        const articleDate = customDate ? new Date(customDate).toISOString() : (currentEditingItem.date || new Date().toISOString());

        if (isFirebaseConfigured() && db) {
          const docRef = doc(db, "news", currentEditingId);
          await updateDoc(docRef, {
            title,
            description,
            category,
            author,
            imageUrl,
            imagePath,
            date: Timestamp.fromDate(new Date(articleDate))
          });
        } else {
          const index = allNewsList.findIndex(n => n.id === currentEditingId);
          if (index !== -1) {
            allNewsList[index] = {
              ...allNewsList[index],
              title,
              description,
              category,
              author,
              imageUrl,
              imagePath,
              date: articleDate
            };
            saveLocalCachedNews(allNewsList);
          }
        }

        showToast("Article updated successfully!", "success");
        closeModal();
        await loadAdminNewsList();
      } catch (error) {
        console.error("Error updating news:", error);
        handleFirestoreError(error, "update", `news/${currentEditingId}`);
        showToast("Failed to update article.", "error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.innerHTML = `Save Changes`;
        }
      }
    });
  }
}

/**
 * Opens Edit Modal with article values populated
 */
function openEditModal(id) {
  const item = allNewsList.find(n => n.id === id);
  if (!item) {
    showToast("Article not found in memory", "error");
    return;
  }

  currentEditingId = id;
  currentEditingItem = item;

  const modal = document.getElementById("edit-news-modal");
  const titleInput = document.getElementById("edit-news-title");
  const descInput = document.getElementById("edit-news-description");
  const catInput = document.getElementById("edit-news-category");
  const authorInput = document.getElementById("edit-news-author");
  const dateInput = document.getElementById("edit-news-date");
  const previewBox = document.getElementById("edit-image-preview");

  if (titleInput) titleInput.value = item.title || "";
  if (descInput) descInput.value = item.description || "";
  if (catInput) catInput.value = item.category || "Pakistan";
  if (authorInput) authorInput.value = item.author || "";
  
  if (dateInput) {
    const rawDate = item.date ? (item.date.toDate ? item.date.toDate() : new Date(item.date)) : new Date();
    dateInput.value = rawDate.toISOString().split("T")[0];
  }

  if (previewBox) {
    previewBox.innerHTML = `<img src="${item.imageUrl}" alt="Current" style="width: 100%; height: 100%; object-fit: cover;">`;
  }

  if (modal) modal.classList.add("open");
}

/**
 * Deletes a news item from Firestore and Storage
 */
async function deleteNewsItem(id) {
  const item = allNewsList.find(n => n.id === id);
  if (!item) return;

  const confirmed = window.confirm(`Are you sure you want to delete this article?\n\n"${item.title}"`);
  if (!confirmed) return;

  try {
    if (isFirebaseConfigured() && db) {
      // 1. Delete document from Firestore
      await deleteDoc(doc(db, "news", id));

      // 2. Delete image from Storage if imagePath exists
      if (item.imagePath && storage) {
        try {
          await deleteObject(ref(storage, item.imagePath));
        } catch (storageErr) {
          console.warn("Storage image deletion warning:", storageErr.message);
        }
      }
    } else {
      allNewsList = allNewsList.filter(n => n.id !== id);
      saveLocalCachedNews(allNewsList);
    }

    showToast("Article deleted successfully!", "success");
    await loadAdminNewsList();
  } catch (error) {
    console.error("Error deleting news:", error);
    handleFirestoreError(error, "delete", `news/${id}`);
    showToast("Failed to delete article.", "error");
  }
}

/**
 * Admin Navigation Tabs and Search Filter
 */
function initTabsAndSearch() {
  const navLinks = document.querySelectorAll(".admin-nav-link");
  const tabPanes = document.querySelectorAll(".admin-tab-pane");
  const searchInput = document.getElementById("admin-table-search");

  navLinks.forEach(link => {
    link.addEventListener("click", () => {
      const targetTab = link.getAttribute("data-tab");
      navLinks.forEach(l => l.classList.remove("active"));
      link.classList.add("active");

      tabPanes.forEach(pane => {
        if (pane.id === targetTab) {
          pane.style.display = "block";
        } else {
          pane.style.display = "none";
        }
      });
    });
  });

  if (searchInput) {
    searchInput.addEventListener("input", (e) => {
      const keyword = e.target.value.toLowerCase().trim();
      const filtered = allNewsList.filter(item => 
        (item.title || "").toLowerCase().includes(keyword) ||
        (item.category || "").toLowerCase().includes(keyword) ||
        (item.author || "").toLowerCase().includes(keyword)
      );
      renderAdminNewsTable(filtered);
    });
  }
}

/**
 * Sample Data Seeder Button
 */
function initSeedButton() {
  const seedBtn = document.getElementById("seed-demo-data-btn");
  if (!seedBtn) return;

  seedBtn.addEventListener("click", async () => {
    const confirmSeed = window.confirm("This will load 24 comprehensive news articles with photography across all 6 categories into your database. Continue?");
    if (!confirmSeed) return;

    seedBtn.disabled = true;
    seedBtn.innerHTML = `<span>⏳</span> Seeding Articles...`;

    try {
      if (isFirebaseConfigured() && db) {
        for (const sample of STARTER_NEWS) {
          await addDoc(collection(db, "news"), {
            title: sample.title,
            description: sample.description,
            category: sample.category,
            author: sample.author,
            imageUrl: sample.imageUrl,
            imagePath: sample.imagePath || "",
            date: Timestamp.fromDate(new Date(sample.date)),
            createdAt: serverTimestamp()
          });
        }
      } else {
        allNewsList = [...STARTER_NEWS];
        saveLocalCachedNews(allNewsList);
      }

      showToast("Sample news articles seeded successfully!", "success");
      await loadAdminNewsList();
    } catch (e) {
      console.error("Seeding error:", e);
      showToast("Failed to seed sample articles.", "error");
    } finally {
      seedBtn.disabled = false;
      seedBtn.innerHTML = `✨ Seed Sample News Articles`;
    }
  });
}

document.addEventListener("DOMContentLoaded", initAdminPanel);
