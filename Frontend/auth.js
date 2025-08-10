// frontend/auth.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  getIdToken
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";

// Paste your Firebase config here
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

const emailInput = document.getElementById('email');
const passInput  = document.getElementById('password');
const loginBtn   = document.getElementById('loginBtn');
const signupBtn  = document.getElementById('signupBtn');
const googleBtn  = document.getElementById('googleBtn');
const msgEl      = document.getElementById('message');

function show(msg, err = false){
  msgEl.textContent = msg;
  msgEl.style.color = err ? '#ffb3b3' : '#9fb0c9';
}

// signup
signupBtn.onclick = async () => {
  try {
    const email = emailInput.value.trim(), password = passInput.value;
    if(!email || !password) return show("Provide email and password", true);
    const userCred = await createUserWithEmailAndPassword(auth, email, password);
    show("Signup successful — redirecting...");
    // token handling will run in onAuthStateChanged below
  } catch(e) {
    show(e.message, true);
  }
};

// login
loginBtn.onclick = async () => {
  try {
    const email = emailInput.value.trim(), password = passInput.value;
    if(!email || !password) return show("Provide email and password", true);
    await signInWithEmailAndPassword(auth, email, password);
    show("Login successful — redirecting...");
  } catch(e) {
    show(e.message, true);
  }
};

// google sign-in
googleBtn.onclick = async () => {
  try {
    await signInWithPopup(auth, googleProvider);
    show("Signed in with Google — redirecting...");
  } catch(e) {
    show(e.message, true);
  }
};

// listen to auth state changes, save fresh ID token into sessionStorage
onAuthStateChanged(auth, async (user) => {
  if (user) {
    const idToken = await getIdToken(user, /* forceRefresh= */ false);
    // store token for frontend calls (sessionStorage only)
    sessionStorage.setItem('idToken', idToken);
    sessionStorage.setItem('userEmail', user.email || '');
    // redirect to chatbot
    setTimeout(()=> window.location.href = 'index.html', 600);
  } else {
    // not signed in — ensure token cleared
    sessionStorage.removeItem('idToken');
    sessionStorage.removeItem('userEmail');
  }
});

// optional logout helper
export async function doSignOut(){
  await signOut(auth);
  sessionStorage.removeItem('idToken');
  sessionStorage.removeItem('userEmail');
  window.location.href = 'auth.html';
}
