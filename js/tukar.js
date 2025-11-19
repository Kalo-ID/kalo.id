// Import "alat" dari firebase.js
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc } from './firebase.js';

const poinHeader = document.getElementById('user-poin-header');
const rewardList = document.getElementById('reward-list');
const guestMessage = document.getElementById('reward-guest-message');
const allButtons = document.querySelectorAll('.btn-tukar');

let currentUserPoin = 0;
let userDocRef = null;

// Disable tombol saat loading
allButtons.forEach(button => {
  button.disabled = true;
  button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span>`;
});

// Cek Auth
if (typeof auth === 'undefined') {
  poinHeader.innerHTML = `<span style="color: red;">Error: Firebase Auth tidak dimuat.</span>`;
} else {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // === USER LOGIN ===
      rewardList.style.display = 'flex'; 
      guestMessage.style.display = 'none';

      try { 
        userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          currentUserPoin = userDoc.data().poin || 0;
          updatePoinDisplay(currentUserPoin);
        } else {
          updatePoinDisplay(0); 
        }
      } catch (error) { 
        console.error("Error data poin:", error);
      }

      updateButtonStatus();

    } else {
      // === USER TAMU ===
      poinHeader.style.display = 'none';
      rewardList.style.display = 'none';
      guestMessage.style.display = 'block';
    }
  });
}

function updatePoinDisplay(poin) {
  poinHeader.innerHTML = `Poin Anda: <strong>${poin}</strong> <i class="bi bi-coin text-warning"></i>`;
}

function updateButtonStatus() {
  allButtons.forEach(button => {
    const cost = parseInt(button.dataset.cost); 
    if (currentUserPoin < cost) {
      button.disabled = true;
      button.innerHTML = "Poin Kurang";
      button.classList.add('btn-secondary');
      button.classList.remove('btn-tukar');
    } else {
      button.disabled = false;
      button.innerHTML = "Tukar Sekarang"; // Teks lebih mengajak
      button.classList.remove('btn-secondary');
      button.classList.add('btn-tukar');
    }
  });
}

// --- LOGIKA PENUKARAN UTAMA ---
allButtons.forEach(button => {
  button.addEventListener('click', async (e) => {
    if (!userDocRef) return;

    // Ambil data dari atribut HTML tombol
    const target = e.target.closest('button');
    const cost = parseInt(target.dataset.cost);
    const name = target.dataset.name;
    const type = target.dataset.type; // 'download' atau 'code'
    const url = target.dataset.url;   // Link gambar/pdf
    const codeVal = target.dataset.value; // Kode voucher

    // 1. Konfirmasi
    const yakin = confirm(`Tukar ${cost} poin untuk mendapatkan "${name}"?`);
    if (!yakin) return;

    // 2. Cek Poin Lagi
    if (currentUserPoin < cost) {
      alert("Poin Anda tidak cukup!");
      return;
    }

    try {
      // 3. Kurangi Poin di Database
      const poinBaru = currentUserPoin - cost;
      await setDoc(userDocRef, { poin: poinBaru }, { merge: true });

      // 4. Update Tampilan
      currentUserPoin = poinBaru;
      updatePoinDisplay(currentUserPoin);
      updateButtonStatus();

      // 5. EKSEKUSI HADIAH (WUJUDNYA)
      
      if (type === 'download') {
        // --- JIKA DOWNLOAD ---
        alert(`BERHASIL! 🎉\n\nSisa Poin: ${poinBaru}\n\nFile "${name}" akan otomatis terbuka/terdownload di tab baru.`);
        // Buka link di tab baru (Trigger Download)
        window.open(url, '_blank');
      
      } else if (type === 'code') {
        // --- JIKA KODE VOUCHER ---
        // Gunakan prompt agar user bisa copy kodenya
        prompt(`BERHASIL MENUKAR! 🎉\n\nSilakan screenshot atau copy kode voucher ini:`, codeVal);
        alert(`Jangan lupa simpan kodenya ya! Sisa poin Anda: ${poinBaru}`);
      }

    } catch (error) {
      console.error("Error tukar:", error);
      alert("Maaf, transaksi gagal. Coba lagi nanti.");
    }
  });
});