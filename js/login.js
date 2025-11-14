// Import "alat" yang sudah kita siapkan di firebase.js
import { 
  auth, 
  db, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  doc,
  setDoc,
  sendPasswordResetEmail,
  setPersistence,             // <-- ALAT BARU
  browserLocalPersistence   // <-- ALAT BARU
} from './firebase.js';

// Ambil semua elemen dari HTML
const formLogin = document.getElementById('form-login');
const formRegister = document.getElementById('form-register');
const formLupa = document.getElementById('form-lupa'); 

const showRegisterLink = document.getElementById('show-register');
const showLoginLink = document.getElementById('show-login');
const showLupaLink = document.getElementById('show-lupa'); 
const backToLoginLink = document.getElementById('back-to-login'); 

// ... (Kode elemen form biarkan sama) ...
const registerBtn = document.getElementById('register-btn');
const registerNama = document.getElementById('register-nama');
const registerEmail = document.getElementById('register-email');
const registerPass = document.getElementById('register-pass');
const loginBtn = document.getElementById('login-btn');
const loginEmail = document.getElementById('login-email');
const loginPass = document.getElementById('login-pass');
const lupaBtn = document.getElementById('lupa-btn');
const lupaEmail = document.getElementById('lupa-email');

// ... (Kode ganti form biarkan sama) ...
showRegisterLink.addEventListener('click', (e) => {
  e.preventDefault();
  formLogin.style.display = 'none';
  formLupa.style.display = 'none';
  formRegister.style.display = 'block';
});
showLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  formLogin.style.display = 'block';
  formRegister.style.display = 'none';
  formLupa.style.display = 'none';
});
showLupaLink.addEventListener('click', (e) => {
  e.preventDefault();
  formLogin.style.display = 'none';
  formRegister.style.display = 'none';
  formLupa.style.display = 'block';
});
backToLoginLink.addEventListener('click', (e) => {
  e.preventDefault();
  formLogin.style.display = 'block';
  formRegister.style.display = 'none';
  formLupa.style.display = 'none';
});

// ... (Fungsi Registrasi biarkan sama) ...
registerBtn.addEventListener('click', async (e) => {
  e.preventDefault(); 
  const nama = registerNama.value;
  const email = registerEmail.value;
  const password = registerPass.value;
  if (!nama || !email || !password) {
    alert("Harap isi semua kolom!");
    return;
  }
  try {
    // Saat REGISTRASI, kita juga set persistence
    await setPersistence(auth, browserLocalPersistence); // <-- TAMBAHAN
    
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    await setDoc(doc(db, "users", user.uid), {
      nama: nama,
      email: email,
      poin: 0,
      terakhirKlaim: 0
    });
    alert(`Akun untuk ${nama} berhasil dibuat! Mengalihkan ke halaman utama...`);
    window.location.href = 'index.html';
  } catch (error) {
    console.error("Error mendaftar:", error);
    alert("Error: " + error.message);
  }
});

// --- FUNGSI UTAMA: LOGIN ---
loginBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  
  const email = loginEmail.value;
  const password = loginPass.value;

  if (!email || !password) {
    alert("Harap isi email dan password!");
    return;
  }

  try {
    // ▼▼▼ BARIS INI KITA TAMBAHKAN ▼▼▼
    // Perintahkan Firebase untuk "Ingat Saya" di seluruh browser
    await setPersistence(auth, browserLocalPersistence);
    // ▲▲▲ BARIS INI KITA TAMBAHKAN ▲▲▲

    // 1. Coba login dengan Firebase Auth
    await signInWithEmailAndPassword(auth, email, password);
    
    alert("Login berhasil! Mengalihkan ke halaman utama...");
    window.location.href = 'index.html';

  } catch (error) {
    console.error("Error login:", error);
    alert("Error: " + error.message);
  }
});

// ... (Fungsi Lupa Password biarkan sama) ...
lupaBtn.addEventListener('click', async (e) => {
  e.preventDefault();
  const email = lupaEmail.value;
  if (!email) {
    alert("Silakan masukkan email Anda yang terdaftar.");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Email terkirim!\n\nEmail mungkin butuh 1-2 menit untuk sampai.\n\n**PENTING: HARAP CEK FOLDER SPAM ANDA!**");
    formLogin.style.display = 'block';
    formRegister.style.display = 'none';
    formLupa.style.display = 'none';
  } catch (error) {
    console.error("Error kirim email reset:", error);
    if (error.code === 'auth/user-not-found') {
      alert("Error: Email tidak terdaftar. Pastikan email sudah benar.");
    } else {
      alert("Error: Gagal mengirim email reset. Coba lagi.");
    }
  }
});