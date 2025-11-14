// Import "alat" dari firebase.js
import { auth, db, onAuthStateChanged, doc, getDoc, setDoc } from './firebase.js';

// Ambil elemen dari halaman tukar.html
const poinHeader = document.getElementById('user-poin-header');
const rewardList = document.getElementById('reward-list');
const guestMessage = document.getElementById('reward-guest-message');
const allButtons = document.querySelectorAll('.btn-tukar');

let currentUserPoin = 0; // Variabel untuk menyimpan poin pengguna
let userDocRef = null; // Variabel untuk menyimpan referensi dokumen

// Nonaktifkan tombol saat loading dan beri status loading
allButtons.forEach(button => {
  button.disabled = true;
  button.innerHTML = `<span class="spinner-border spinner-border-sm" role="status"></span>`;
});

// PERBAIKAN: Tambahkan pengecekan auth
if (typeof auth === 'undefined') {
  poinHeader.innerHTML = `<span style="color: red;">Error: Firebase Auth tidak dimuat. Cek firebase.js.</span>`;
  rewardList.style.display = 'none';
  guestMessage.style.display = 'block';
} else {
  // Cek status login
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // --- PENGGUNA SUDAH LOGIN ---
      
      // Tampilkan daftar hadiah, sembunyikan pesan tamu
      rewardList.style.display = 'flex'; 
      guestMessage.style.display = 'none';

      try { 
        // Ambil data poin
        userDocRef = doc(db, "users", user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          currentUserPoin = userDoc.data().poin || 0;
          updatePoinDisplay(currentUserPoin);
        } else {
          console.log("Dokumen pengguna tidak ditemukan!");
          updatePoinDisplay(0); 
        }
      } catch (error) { 
        console.error("Error mengambil data poin:", error);
        poinHeader.innerHTML = `<span style="color: red;">Error: Gagal memuat poin.</span>`;
        alert("Error: Tidak bisa mengambil data poin. Silakan cek koneksi internet atau login ulang.");
        return; 
      }

      // Aktifkan/Nonaktifkan tombol berdasarkan poin
      updateButtonStatus();

    } else {
      // --- PENGGUNA BELUM LOGIN (TAMU) ---
      poinHeader.style.display = 'none';
      rewardList.style.display = 'none';
      guestMessage.style.display = 'block';

      // Pastikan tombol dinonaktifkan untuk tamu
      allButtons.forEach(button => {
          button.disabled = true;
          button.innerHTML = "Login untuk Tukar";
      });
    }
  });
}


// Fungsi untuk update tampilan poin di header
function updatePoinDisplay(poin) {
  poinHeader.innerHTML = `Poin Anda Saat Ini: <strong>${poin} Poin</strong>`;
}

// Fungsi untuk cek status semua tombol
function updateButtonStatus() {
  allButtons.forEach(button => {
    const cost = parseInt(button.dataset.cost); 
    if (currentUserPoin < cost) {
      button.disabled = true;
      button.innerHTML = "Poin Tidak Cukup";
    } else {
      button.disabled = false;
      button.innerHTML = "Tukar";
    }
  });
}

// Tambahkan event listener ke SEMUA tombol tukar
allButtons.forEach(button => {
  button.addEventListener('click', async (e) => {
    // Tambahkan pengecekan jika userDocRef belum ada
    if (!userDocRef) {
      alert("Error: Sesi pengguna tidak ditemukan. Silakan login ulang.");
      return;
    }

    const cost = parseInt(e.target.dataset.cost);
    const name = e.target.dataset.name;

    // Konfirmasi
    const yakin = confirm(`Anda yakin ingin menukar ${cost} poin dengan "${name}"?`);
    if (!yakin) {
      return; 
    }

    // Cek ulang poin (jaga-jaga)
    if (currentUserPoin < cost) {
      alert("Poin Anda tidak cukup!");
      return;
    }

    // Proses penukaran
    try {
      const poinBaru = currentUserPoin - cost;
      
      // Update data di Firebase
      await setDoc(userDocRef, { poin: poinBaru }, { merge: true });

      // Update data lokal & tampilan
      currentUserPoin = poinBaru;
      updatePoinDisplay(currentUserPoin);
      updateButtonStatus(); // Cek ulang status semua tombol

      alert(`Selamat! Anda berhasil menukar poin dengan "${name}". Sisa poin Anda: ${poinBaru}`);

    } catch (error) {
      console.error("Error menukar poin:", error);
      alert("Terjadi error saat menukar poin.");
    }
  });
});