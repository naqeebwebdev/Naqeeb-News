// ==========================================================================
// NAQEEB NEWS — ADMIN LOGIN SCRIPT
// Authenticates administrator via Firebase Authentication (Email/Password)
// ==========================================================================

import {
  auth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  onAuthStateChanged
} from "./firebase.js";
import { isFirebaseConfigured } from "./firebase-config.js";
import { showToast, escapeHtml } from "./common.js";

async function initAdminLoginPage() {
  const loginForm = document.getElementById("admin-login-form");
  const alertBox = document.getElementById("login-alert");
  const loginBtn = document.getElementById("login-submit-btn");

  // Check if user is already authenticated
  if (isFirebaseConfigured() && auth) {
    onAuthStateChanged(auth, (user) => {
      if (user) {
        window.location.href = "admin-panel.html";
      }
    });
  } else {
    // Check local session for offline/demo testing
    if (sessionStorage.getItem("naqeeb_admin_authenticated") === "true") {
      window.location.href = "admin-panel.html";
    }
  }

  function showAlert(msg, type = "error") {
    if (!alertBox) return;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = "flex";
    alertBox.innerHTML = `
      <span>${type === "success" ? "✓" : "⚠️"}</span>
      <div>${escapeHtml(msg)}</div>
    `;
  }

  function hideAlert() {
    if (alertBox) alertBox.style.display = "none";
  }

  const AUTHORIZED_ADMIN_EMAIL = "naqeeb.webdev@gmail.com";
  const AUTHORIZED_ADMIN_PASS = "1234567890";

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      const emailInput = document.getElementById("login-email");
      const passwordInput = document.getElementById("login-password");

      const email = (emailInput?.value || "").trim().toLowerCase();
      const password = (passwordInput?.value || "").trim();

      if (!email || !password) {
        showAlert("Please enter both your admin email and password.");
        return;
      }

      // Strict check for admin credentials
      if (email !== AUTHORIZED_ADMIN_EMAIL.toLowerCase() || password !== AUTHORIZED_ADMIN_PASS) {
        showAlert("Access Denied: Invalid admin credentials.", "error");
        return;
      }

      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = `<span>⏳</span> Authenticating...`;
      }

      try {
        if (isFirebaseConfigured() && auth) {
          try {
            await signInWithEmailAndPassword(auth, email, password);
          } catch (firebaseErr) {
            try {
              await createUserWithEmailAndPassword(auth, email, password);
            } catch (createErr) {
              // Ignore if already created or fallback
            }
          }
        }

        // Set authenticated session for owner
        sessionStorage.setItem("naqeeb_admin_authenticated", "true");
        sessionStorage.setItem("naqeeb_admin_email", AUTHORIZED_ADMIN_EMAIL);
        showToast("Welcome Naqeeb! Signed in successfully.", "success");
        window.location.href = "admin-panel.html";

      } catch (error) {
        console.error("Auth action error:", error);
        showAlert("Authentication failed. Please try again.", "error");
      } finally {
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.innerHTML = `Sign In to Dashboard →`;
        }
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initAdminLoginPage);
