// ==========================================================================
// NAQEEB NEWS — ADMIN LOGIN SCRIPT
// Authenticates administrator via Firebase Authentication (Email/Password)
// ==========================================================================

import {
  auth,
  signInWithEmailAndPassword,
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

  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      hideAlert();

      const emailInput = document.getElementById("login-email");
      const passwordInput = document.getElementById("login-password");

      const email = (emailInput?.value || "").trim();
      const password = (passwordInput?.value || "").trim();

      if (!email || !password) {
        showAlert("Please enter both email and password.");
        return;
      }

      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = `<span>⏳</span> Signing In...`;
      }

      try {
        if (isFirebaseConfigured() && auth) {
          const userCredential = await signInWithEmailAndPassword(auth, email, password);
          showToast("Signed in successfully!", "success");
          window.location.href = "admin-panel.html";
        } else {
          // Demo / Local development fallback
          if (email && password.length >= 6) {
            sessionStorage.setItem("naqeeb_admin_authenticated", "true");
            sessionStorage.setItem("naqeeb_admin_email", email);
            showToast("Signed in (Demo Mode)!", "success");
            window.location.href = "admin-panel.html";
          } else {
            throw new Error("Invalid credentials or password too short (min 6 chars).");
          }
        }
      } catch (error) {
        console.error("Login failed:", error);
        let userMessage = "Login failed. Please check your email and password.";
        
        if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
          userMessage = "Invalid email or password. Please verify your credentials or create the admin user in Firebase Console.";
        } else if (error.code === "auth/too-many-requests") {
          userMessage = "Access to this account has been temporarily disabled due to many failed attempts. Try again later.";
        } else if (error.message) {
          userMessage = error.message;
        }

        showAlert(userMessage, "error");
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
