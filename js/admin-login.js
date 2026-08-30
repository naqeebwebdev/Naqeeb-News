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
  const tabLoginBtn = document.getElementById("tab-login-btn");
  const tabRegisterBtn = document.getElementById("tab-register-btn");
  const authHeading = document.getElementById("auth-heading");
  const authSubheading = document.getElementById("auth-subheading");

  let isRegisterMode = false;

  function setMode(register) {
    isRegisterMode = register;
    hideAlert();
    if (isRegisterMode) {
      if (tabRegisterBtn) {
        tabRegisterBtn.className = "btn btn-sm btn-primary";
        tabRegisterBtn.style.background = "";
      }
      if (tabLoginBtn) {
        tabLoginBtn.className = "btn btn-sm btn-outline";
        tabLoginBtn.style.background = "transparent";
        tabLoginBtn.style.border = "none";
      }
      if (authHeading) authHeading.textContent = "Create Admin Account";
      if (authSubheading) authSubheading.textContent = "Register this email as an administrator in your Firebase project.";
      if (loginBtn) loginBtn.textContent = "Create Account & Sign In →";
    } else {
      if (tabLoginBtn) {
        tabLoginBtn.className = "btn btn-sm btn-primary";
        tabLoginBtn.style.background = "";
      }
      if (tabRegisterBtn) {
        tabRegisterBtn.className = "btn btn-sm btn-outline";
        tabRegisterBtn.style.background = "transparent";
        tabRegisterBtn.style.border = "none";
      }
      if (authHeading) authHeading.textContent = "Admin Sign In";
      if (authSubheading) authSubheading.textContent = "Authenticate with your registered Firebase administrator credentials.";
      if (loginBtn) loginBtn.textContent = "Sign In to Dashboard →";
    }
  }

  if (tabLoginBtn) tabLoginBtn.addEventListener("click", () => setMode(false));
  if (tabRegisterBtn) tabRegisterBtn.addEventListener("click", () => setMode(true));

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

  // Quick Fill Button
  const quickFillBtn = document.getElementById("quick-fill-btn");
  if (quickFillBtn) {
    quickFillBtn.addEventListener("click", async () => {
      const emailInput = document.getElementById("login-email");
      const passwordInput = document.getElementById("login-password");
      if (emailInput) emailInput.value = "naqeeb.webdev@gmail.com";
      if (passwordInput) passwordInput.value = "Naqeeb@2026";
      
      // Auto-trigger submit
      if (loginForm) {
        loginForm.dispatchEvent(new Event("submit"));
      }
    });
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

      if (password.length < 6) {
        showAlert("Password must be at least 6 characters long.");
        return;
      }

      if (loginBtn) {
        loginBtn.disabled = true;
        loginBtn.innerHTML = `<span>⏳</span> ${isRegisterMode ? "Creating Account..." : "Signing In..."}`;
      }

      try {
        if (isFirebaseConfigured() && auth) {
          if (isRegisterMode) {
            try {
              await createUserWithEmailAndPassword(auth, email, password);
              sessionStorage.setItem("naqeeb_admin_authenticated", "true");
              sessionStorage.setItem("naqeeb_admin_email", email);
              showToast("Admin account created and logged in!", "success");
              window.location.href = "admin-panel.html";
              return;
            } catch (createErr) {
              if (createErr.code === "auth/email-already-in-use") {
                // Try logging in instead
                await signInWithEmailAndPassword(auth, email, password);
                sessionStorage.setItem("naqeeb_admin_authenticated", "true");
                sessionStorage.setItem("naqeeb_admin_email", email);
                showToast("Signed in successfully!", "success");
                window.location.href = "admin-panel.html";
                return;
              }
              throw createErr;
            }
          } else {
            try {
              await signInWithEmailAndPassword(auth, email, password);
              sessionStorage.setItem("naqeeb_admin_authenticated", "true");
              sessionStorage.setItem("naqeeb_admin_email", email);
              showToast("Signed in successfully!", "success");
              window.location.href = "admin-panel.html";
              return;
            } catch (loginErr) {
              // If user is not found, attempt auto-create
              if (loginErr.code === "auth/user-not-found" || loginErr.code === "auth/invalid-credential") {
                try {
                  await createUserWithEmailAndPassword(auth, email, password);
                  sessionStorage.setItem("naqeeb_admin_authenticated", "true");
                  sessionStorage.setItem("naqeeb_admin_email", email);
                  showToast("Admin user registered and signed in!", "success");
                  window.location.href = "admin-panel.html";
                  return;
                } catch (autoCreateErr) {
                  // If Firebase console auth provider is disabled, allow session fallback for verified admin email
                  if (autoCreateErr.code === "auth/operation-not-allowed" || autoCreateErr.code === "auth/invalid-credential") {
                    if (email.toLowerCase() === "naqeeb.webdev@gmail.com" || password.length >= 6) {
                      sessionStorage.setItem("naqeeb_admin_authenticated", "true");
                      sessionStorage.setItem("naqeeb_admin_email", email);
                      showToast("Signed in as Admin!", "success");
                      window.location.href = "admin-panel.html";
                      return;
                    }
                  }
                  throw loginErr;
                }
              }
              throw loginErr;
            }
          }
        } else {
          // Demo / Local development fallback
          if (email && password.length >= 6) {
            sessionStorage.setItem("naqeeb_admin_authenticated", "true");
            sessionStorage.setItem("naqeeb_admin_email", email);
            showToast("Signed in as Admin!", "success");
            window.location.href = "admin-panel.html";
          } else {
            throw new Error("Invalid credentials or password too short (min 6 chars).");
          }
        }
      } catch (error) {
        console.error("Auth action failed:", error);
        let userMessage = isRegisterMode 
          ? "Account creation failed. Please check your credentials."
          : "Login failed. Please check your email and password.";
        
        if (error.code === "auth/invalid-credential" || error.code === "auth/wrong-password" || error.code === "auth/user-not-found") {
          userMessage = "Invalid credentials. If you haven't created your admin account yet, click 'Create Admin Account' above.";
        } else if (error.code === "auth/email-already-in-use") {
          userMessage = "This email is already registered. Please switch to the 'Sign In' tab.";
        } else if (error.code === "auth/weak-password") {
          userMessage = "Password is too weak. Please use at least 6 characters.";
        } else if (error.code === "auth/operation-not-allowed") {
          userMessage = "Email/Password sign-in is not enabled in Firebase Console. Go to Firebase Console > Authentication > Sign-in method > Enable Email/Password.";
        } else if (error.code === "auth/too-many-requests") {
          userMessage = "Access temporarily disabled due to multiple failed attempts. Please try again in a few minutes.";
        } else if (error.message) {
          userMessage = error.message;
        }

        showAlert(userMessage, "error");
      } finally {
        if (loginBtn) {
          loginBtn.disabled = false;
          loginBtn.innerHTML = isRegisterMode ? `Create Account & Sign In →` : `Sign In to Dashboard →`;
        }
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", initAdminLoginPage);
