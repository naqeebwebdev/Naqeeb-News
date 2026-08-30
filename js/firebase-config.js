// ==========================================================================
// NAQEEB NEWS — FIREBASE CONFIGURATION
// Replace the placeholder values below with your Firebase project credentials
// obtained from Firebase Console (Project Settings > General > Your apps > Web app)
// ==========================================================================

export const firebaseConfig = {
  apiKey: "AIzaSyA30bmMW1uZoRmQtZf9Lb42WGmJjxcysLQ",
  authDomain: "naqeeb-news-2ed09.firebaseapp.com",
  projectId: "naqeeb-news-2ed09",
  storageBucket: "naqeeb-news-2ed09.firebasestorage.app",
  messagingSenderId: "150990877993",
  appId: "1:150990877993:web:64d96a2ecc11fe3041f338"
};

/**
 * Checks whether Firebase configuration has been populated with real project keys
 * @returns {boolean}
 */
export function isFirebaseConfigured() {
  return (
    firebaseConfig.apiKey &&
    firebaseConfig.apiKey !== "YOUR_API_KEY" &&
    firebaseConfig.projectId &&
    firebaseConfig.projectId !== "YOUR_PROJECT_ID"
  );
}
