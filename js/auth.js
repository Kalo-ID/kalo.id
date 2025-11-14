// Import "alat" yang sesungguhnya dari firebase.js
// Kita tambahkan 'setDoc' untuk menyimpan data
import { auth, db, onAuthStateChanged, signOut, doc, getDoc, setDoc } from './firebase.js';

// Ambil elemen-elemen dari halaman
const dashboardLoading = document.getElementById('dashboard-loading'); // <-- BARU
const dashboardTamu = document.getElementById('dashboard-tamu');
const dashboardMember = document.getElementById('dashboard-member');
const navLoginLogout = document.getElementById('nav-login-logout'); 
const userPoinDisplay = document.getElementById('user-poin');

// Ambil elemen tombol klaim
const claimButton = document.getElementById('btn-claim-daily');
const claimStatus = document.getElementById('claim-status');

// Ini adalah "penjaga" Firebase. 
onAuthStateChanged(auth, async (user) => {

  if (user) {
    // === PENGGUNA SUDAH LOGIN ===

    // 1. Ambil data pengguna (poin & klaim) dari Firestore
    const userDocRef = doc(db, "users", user.uid);
    const userDoc = await getDoc(userDocRef);

    let userPoin = 0;
    let userTerakhirKlaim = 0;

    if (userDoc.exists()) {
      userPoin = userDoc.data().poin || 0;
      userTerakhirKlaim = userDoc.data().terakhirKlaim || 0;
      userPoinDisplay.innerHTML = userPoin;
    } else {
      console.log("Tidak ada data poin untuk pengguna ini.");
      userPoinDisplay.innerHTML = 0;
    }

    // 2. Ubah link "Login" di Navbar menjadi "Logout"
    if (navLoginLogout) {
      navLoginLogout.innerHTML = 'Logout';
      navLoginLogout.href = '#'; 
      
      if (!navLoginLogout.listenerAdded) {
        navLoginLogout.addEventListener('click', async (e) => {
          e.preventDefault();
          try {
            await signOut(auth);
            alert("Anda berhasil logout.");
            window.location.href = 'index.html'; 
          } catch (error) {
            console.error("Error logout:", error);
          }
        });
        navLoginLogout.listenerAdded = true; 
      }
    }
    
    // 3. LOGIKA UNTUK KLAIM HARIAN
    const SEKARANG = Date.now();
    const DUA_PULUH_EMPAT_JAM = 24 * 60 * 60 * 1000;
    const sisaWaktu = (userTerakhirKlaim + DUA_PULUH_EMPAT_JAM) - SEKARANG;

    if (sisaWaktu > 0) {
      // Jika MASIH harus menunggu
      claimButton.disabled = true;
      const sisaJam = Math.floor(sisaWaktu / 3600000);
      const sisaMenit = Math.floor((sisaWaktu % 3600000) / 60000);
      claimStatus.innerHTML = `Bisa klaim lagi dalam ${sisaJam} jam ${sisaMenit} menit.`;
    } else {
      // Jika SUDAH boleh klaim
      claimButton.disabled = false;
      claimStatus.innerHTML = "Anda bisa klaim 10 poin harian!";
    }

    // Tambahkan event saat tombol di-klik
    if (!claimButton.listenerAdded) { // Mencegah event listener ganda
      claimButton.addEventListener('click', async () => {
        // Cek ulang (jaga-jaga)
        const waktuKlik = Date.now();
        // Cek waktu terakhir dari variabel lokal (lebih cepat)
        if (waktuKlik - userTerakhirKlaim < DUA_PULUH_EMPAT_JAM) {
          alert("Maaf, Anda baru saja mengklaim. Harap tunggu.");
          return;
        }

        try {
          const poinBaru = userPoin + 10;
          await setDoc(userDocRef, { 
            poin: poinBaru, 
            terakhirKlaim: waktuKlik 
          }, { merge: true });

          // Update tampilan di halaman
          userPoinDisplay.innerHTML = poinBaru;
          claimButton.disabled = true;
          claimStatus.innerHTML = "Klaim berhasil! Coba lagi besok.";
          alert(`Selamat! Anda mendapatkan 10 poin. Total poin Anda sekarang: ${poinBaru}`);

          // Update data lokal agar konsisten
          userPoin = poinBaru;
          userTerakhirKlaim = waktuKlik;

        } catch (error) {
          console.error("Error saat klaim poin:", error);
          alert("Terjadi error. Gagal klaim poin.");
        }
      });
      claimButton.listenerAdded = true; // Tandai
    }
    
    // 4. Tampilkan/Sembunyikan Dashboard yang benar
    if (dashboardLoading) dashboardLoading.style.display = 'none';
    if (dashboardTamu) dashboardTamu.style.display = 'none';
    if (dashboardMember) dashboardMember.style.display = 'block';


  } else {
    // === PENGGUNA BELUM LOGIN (TAMU) ===

    // Tampilkan/Sembunyikan Dashboard yang benar
    if (dashboardLoading) dashboardLoading.style.display = 'none';
    if (dashboardTamu) dashboardTamu.style.display = 'block';
    if (dashboardMember) dashboardMember.style.display = 'none';

    // Pastikan link di Navbar adalah "Login"
    if (navLoginLogout) {
      navLoginLogout.innerHTML = 'Login';
      navLoginLogout.href = 'login.html';
      navLoginLogout.listenerAdded = false; 
    }
  }
});
