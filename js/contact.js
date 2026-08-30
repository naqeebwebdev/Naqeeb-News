// ==========================================================================
// NAQEEB NEWS — CONTACT FORM SCRIPT
// Validates visitor inquiry inputs and stores submission in Firestore 'messages'
// ==========================================================================

import {
  db,
  collection,
  addDoc,
  serverTimestamp,
  handleFirestoreError
} from "./firebase.js";
import { isFirebaseConfigured } from "./firebase-config.js";
import { showToast, escapeHtml } from "./common.js";

async function initContactPage() {
  const contactForm = document.getElementById("contact-form");
  const alertBox = document.getElementById("contact-alert");
  const submitBtn = document.getElementById("contact-submit-btn");

  if (!contactForm) return;

  function showAlert(msg, type = "success") {
    if (!alertBox) return;
    alertBox.className = `alert alert-${type}`;
    alertBox.style.display = "flex";
    alertBox.innerHTML = `
      <span>${type === "success" ? "✓" : "⚠️"}</span>
      <div>${escapeHtml(msg)}</div>
    `;
    alertBox.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }

  function hideAlert() {
    if (alertBox) {
      alertBox.style.display = "none";
    }
  }

  contactForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const nameInput = document.getElementById("contact-name");
    const emailInput = document.getElementById("contact-email");
    const messageInput = document.getElementById("contact-message");

    const name = (nameInput?.value || "").trim();
    const email = (emailInput?.value || "").trim();
    const message = (messageInput?.value || "").trim();

    // Client-side Validation
    if (!name || name.length < 2) {
      showAlert("Please enter your full name (minimum 2 characters).", "error");
      nameInput?.focus();
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      showAlert("Please provide a valid email address.", "error");
      emailInput?.focus();
      return;
    }

    if (!message || message.length < 5) {
      showAlert("Please enter your message (minimum 5 characters).", "error");
      messageInput?.focus();
      return;
    }

    // Submit state
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>⏳</span> Sending Message...`;
    }

    try {
      if (isFirebaseConfigured() && db) {
        await addDoc(collection(db, "messages"), {
          name,
          email,
          message,
          createdAt: serverTimestamp()
        });
      } else {
        // Fallback local storage for testing when keys are unconfigured
        const localMessages = JSON.parse(localStorage.getItem("naqeeb_news_messages") || "[]");
        localMessages.push({
          id: "local-msg-" + Date.now(),
          name,
          email,
          message,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem("naqeeb_news_messages", JSON.stringify(localMessages));
      }

      showAlert("Thank you! Your message has been sent successfully. Our editorial team will review it shortly.", "success");
      showToast("Message sent successfully!", "success");
      contactForm.reset();
    } catch (error) {
      console.error("Error submitting contact message:", error);
      handleFirestoreError(error, "create", "messages");
      showAlert("Failed to send your message. Please verify your connection or try again later.", "error");
      showToast("Failed to send message.", "error");
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = `Send Message →`;
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", initContactPage);
