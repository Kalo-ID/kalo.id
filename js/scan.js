/**
 * scan.js
 * Logika Scanner dengan ZXing dan integrasi Poin Firebase
 * Final Logic: Stop kamera setelah scan berhasil (sukses/gagal), dan validasi ketat untuk poin.
 */

import { auth, db, onAuthStateChanged, doc, getDoc, setDoc } from './firebase.js';

// --- INISIALISASI ZXing reader ---
const codeReader = new ZXing.BrowserMultiFormatReader();

// --- Database produk lokal (mengandung info gizi) ---
// --- Database produk lokal (Update dari Katalog Kalori) ---
// --- Database produk lokal (Update: 20 Nov 2025) ---
const productDatabase = {
  // ==========================================
  // 1. KATEGORI: BUAH-BUAHAN (Simulasi Barcode Toko)
  // ==========================================
  '2001001001001': {
    name: 'Apel Fuji (100g)',
    info: '<strong>Energi:</strong> 52 kkal | <strong>Gula:</strong> 10.39g | <strong>Serat:</strong> 2.4g',
    warning: '✅ KAYA SERAT',
    suggestion: 'Makan dengan kulitnya untuk serat maksimal. [Sumber: Katalog Hal 6]',
    isProduct: true
  },
  '2001001001002': {
    name: 'Pisang Cavendish (100g)',
    info: '<strong>Energi:</strong> 89 kkal | <strong>Karbo:</strong> 22.84g | <strong>Gula:</strong> 12.23g',
    warning: '⚡ SUMBER ENERGI INSTAN',
    suggestion: 'Cocok dimakan sebelum olahraga. [Sumber: Katalog Hal 6]',
    isProduct: true
  },
  '2001001001003': {
    name: 'Alpukat Mentega (100g)',
    info: '<strong>Energi:</strong> 160 kkal | <strong>Lemak:</strong> 14.66g | <strong>Gula:</strong> 0.66g',
    warning: '✅ LEMAK SEHAT',
    suggestion: 'Tinggi kalori tapi lemak baik. Konsumsi secukupnya. [Sumber: Katalog Hal 8]',
    isProduct: true
  },

  // ==========================================
  // 2. KATEGORI: MIE INSTAN (Barcode Umum)
  // ==========================================
  '8998866200578': { // Indomie Goreng Biasa
    name: 'Indomie Mi Goreng (85g)',
    info: '<strong>Energi:</strong> 380 kkal | <strong>Karbo:</strong> 54g | <strong>Lemak:</strong> 14g',
    warning: '⚠️ TINGGI KALORI & NATRIUM',
    suggestion: 'Tambahkan sayur dan kurangi bumbu untuk lebih sehat. [Sumber: Katalog Hal 74]',
    isProduct: true
  },
  '8998866200592': { // Pop Mie Ayam
    name: 'Pop Mie Rasa Ayam (75g)',
    info: '<strong>Energi:</strong> 350 kkal | <strong>Gula:</strong> 4g | <strong>Lemak:</strong> 16g',
    warning: '⚠️ MAKANAN OLAHAN',
    suggestion: 'Praktis, tapi batasi konsumsi mingguan. [Sumber: Katalog Hal 73]',
    isProduct: true
  },
  '8801073110571': { // Samyang Buldak
    name: 'Samyang Buldak Ramen (140g)',
    info: '<strong>Energi:</strong> 530 kkal | <strong>Gula:</strong> 7g | <strong>Lemak:</strong> 16g',
    warning: '⚠️ KALORI SANGAT TINGGI',
    suggestion: '1 porsi = 1/4 kebutuhan harian! Sebaiknya berbagi. [Sumber: Katalog Hal 74]',
    isProduct: true
  },

  // ==========================================
  // 3. KATEGORI: SNACK & BISKUIT
  // ==========================================
  '7622300464293': { // Oreo Original
    name: 'Oreo Original (3 Keping)',
    info: '<strong>Energi:</strong> 140 kkal | <strong>Gula:</strong> 11g | <strong>Karbo:</strong> 21g',
    warning: '⚠️ TINGGI GULA',
    suggestion: '3 keping = 140 kkal. Jangan habiskan sebungkus! [Sumber: Katalog Hal 66]',
    isProduct: true
  },
  '8992741956016': { // Chitato Sapi Panggang
    name: 'Chitato Sapi Panggang (35g)', 
    info: '<strong>Energi:</strong> 110 kkal (per 20g)', 
    warning: '⚠️ TINGGI LEMAK JENUH',
    suggestion: 'Keripik kentang mengandung kalori padat. [Sumber: Katalog Hal 69]',
    isProduct: true
  },
  '8851019030172': { // Pocky Chocolate
    name: 'Pocky Chocolate (47g)',
    info: '<strong>Energi:</strong> 230 kkal | <strong>Gula:</strong> 12g | <strong>Karbo:</strong> 32g',
    warning: '⚠️ CAMILAN MANIS',
    suggestion: 'Enak tapi tinggi gula. Cocok sebagai treat sesekali. [Sumber: Katalog Hal 64]',
    isProduct: true
  },

  // ==========================================
  // 4. KATEGORI: MINUMAN KEMASAN
  // ==========================================
  '8996001600268': { // Teh Botol Sosro
    name: 'Teh Botol Sosro (450ml)',
    info: '<strong>Energi:</strong> 140 kkal | <strong>Gula:</strong> 32g !',
    warning: '⛔ GULA SANGAT TINGGI',
    suggestion: 'Mengandung setara ~3 sdm gula. Pilih varian tawar/less sugar. [Sumber: Katalog Hal 88]',
    isProduct: true
  },
  '8992761112119': { // Yakult
    name: 'Yakult (65ml)',
    info: '<strong>Energi:</strong> 50 kkal | <strong>Gula:</strong> 10g',
    warning: '✅ BAIK UNTUK USUS',
    suggestion: 'Probiotik baik, tapi kandungan gula cukup tinggi per ml. [Sumber: Katalog Hal 42]',
    isProduct: true
  },
  '8992775316032': { // Pocari Sweat
    name: 'Pocari Sweat (Can 330ml)',
    info: '<strong>Energi:</strong> 70 kkal (per 250ml)',
    warning: '✅ BAGUS UNTUK HIDRASI',
    suggestion: 'Minum saat banyak berkeringat/olahraga. [Sumber: Katalog Hal 86]',
    isProduct: true
  }
};
// --- Elemen DOM ---
const startBtn = document.getElementById('start-scan-btn');
const stopBtn = document.getElementById('stop-scan-btn');
const barcodeResultEl = document.getElementById('barcode-result');
const productInfoEl = document.getElementById('product-info');
const scanAlertsEl = document.getElementById('scan-alerts');
const videoElement = document.getElementById('video-scanner'); // Ambil elemen video

// --- Auth state ---
let currentUser = null;
if (typeof onAuthStateChanged === 'function') {
  onAuthStateChanged(auth, (user) => {
    currentUser = user || null;
  });
}

// --- Helper: tampilkan alert singkat ---
function showScanAlert(title, message, type='success') {
  const div = document.createElement('div');
  div.className = 'alert alert-dismissible fade show scan-alert ' + (type === 'success' ? 'alert-success' : 'alert-warning');
  div.innerHTML = `<strong>${title}</strong> — ${message}`;
  scanAlertsEl.innerHTML = ''; 
  scanAlertsEl.appendChild(div);

  setTimeout(()=> {
    if (scanAlertsEl.contains(div)) scanAlertsEl.removeChild(div);
  }, 3500);
}

// --- Menambah poin ke Firestore ---
async function addPoinForScan() {
  if (!currentUser || !auth) {
    showScanAlert('Poin tidak ditambahkan', 'Login untuk mendapatkan poin.', 'warning');
    return;
  }
  
  try {
    const POIN_DAPAT = 5;
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    let poinSekarang = 0;
    if (userDoc.exists()) poinSekarang = userDoc.data().poin || 0;
    const poinBaru = poinSekarang + POIN_DAPAT;
    await setDoc(userDocRef, { poin: poinBaru }, { merge: true });
    showScanAlert('Poin +5', `Anda mendapat ${POIN_DAPAT} poin. Total: ${poinBaru}.`, 'success');
  } catch (err) {
    console.error('Gagal update poin:', err);
    showScanAlert('Error', 'Gagal menambahkan poin (cek console).', 'warning');
  }
}

// --- FUNGSI UTAMA: Tampilkan hasil & Proses Aksi ---
function displayProductInfo(item, codeText) {
  // 1. Tampilkan kode yang terdeteksi
  barcodeResultEl.textContent = `Kode Terdeteksi: ${codeText}`;
  
  // 2. Tampilkan detail produk/aksi
  productInfoEl.innerHTML = `
    <h4 style="text-align:center; color:#00796B; margin-top:6px;">${item.name}</h4>
    <div style="padding:12px; margin:10px auto; max-width:680px; border-radius:8px; border:1px solid #eef6ff; background:#fff;">
      ${item.info}
    </div>
    <p class="${item.warning.includes('TINGGI') ? 'text-danger' : 'text-success'}" style="font-weight:800; text-align:center;">${item.warning}</p>
    <p style="text-align:center; font-style:italic; margin-top:8px; color: #777;">${item.suggestion}</p>
  `;

  // 3. Logika Poin
  if (item.isProduct === true) {
    addPoinForScan(); 
  } else {
    showScanAlert('Aksi Aplikasi Dikenali', 'Kode ini adalah perintah, bukan produk. Poin tidak diberikan.', 'warning');
  }
}

// --- Logika bila hasil didapat (onScanSuccess) ---
function onScanSuccess(result) {
  const codeText = result.getText();
  const item = productDatabase[codeText];

  // 1. Matikan kamera dan sembunyikan tampilan segera setelah sukses scan (terdaftar/tidak)
  stopScanner(); 

  if (item) {
    // KODE DITEMUKAN di database (Tampilkan info gizi)
    displayProductInfo(item, codeText);
  } else {
    // KODE TIDAK DITEMUKAN di database lokal (Tampilkan pesan error)
    barcodeResultEl.textContent = `Kode Terdeteksi: ${codeText}`;
    productInfoEl.innerHTML = `
        <p class="text-danger" style="text-align:center; margin-top:10px; font-weight:700;">
            **BARCODE TIDAK TERDAFTAR DI DATABASE**
        </p>
        <p style="text-align:center; font-style:italic;">
            Kode (${codeText}) tidak cocok dengan produk yang terdaftar. Poin TIDAK diberikan.
        </p>`;
  }
}

// --- Kontrol scanner ---
function startScanner() {
  barcodeResultEl.textContent = 'Mencari perangkat kamera...';
  productInfoEl.innerHTML = '';
  scanAlertsEl.innerHTML = '';
  // Tampilkan elemen video saat mulai
  videoElement.style.display = 'block'; 

  codeReader.getVideoInputDevices()
    .then((videoInputDevices) => {
      if (videoInputDevices.length === 0) {
        showScanAlert('Kamera Tidak Ditemukan', 'Tidak ada perangkat kamera yang terdeteksi.', 'warning');
        barcodeResultEl.textContent = 'Gagal: Tidak ada kamera ditemukan.';
        // Sembunyikan video jika gagal
        videoElement.style.display = 'none';
        return;
      }
      
      const preferredDeviceId = undefined; 
      
      codeReader.decodeFromVideoDevice(preferredDeviceId, 'video-scanner', (result, err) => {
        if (result) {
          onScanSuccess(result);
        }
        if (err && !(err instanceof ZXing.NotFoundException)) {
          console.error("Scanner Error:", err);
          barcodeResultEl.textContent = `Error: ${err.message}`;
          
          if (err.message && (err.message.toLowerCase().includes('permission') || err.message.toLowerCase().includes('notallowederror'))) {
            showScanAlert('Akses Kamera Ditolak!', 'Harap izinkan akses kamera pada browser Anda dan pastikan menggunakan HTTPS/localhost.', 'warning');
            stopScanner(); // Stop dan sembunyikan jika izin ditolak
          }
        }
      });
      barcodeResultEl.textContent = 'Kamera aktif. Arahkan barcode atau QR Code...';
    })
    .catch((err) => {
      console.error('Error saat mencoba mengakses perangkat video:', err);
      barcodeResultEl.textContent = `Gagal membuka kamera: ${err.name} - ${err.message}`;
      if (err.name === 'NotAllowedError') {
         showScanAlert('Izin Kamera Ditolak!', 'Harap izinkan akses kamera pada browser Anda dan pastikan menggunakan HTTPS/localhost.', 'warning');
      }
      stopScanner();
    });
}

function stopScanner() {
  if (codeReader) {
    try { 
      codeReader.reset();
    } catch(e){ /* abaikan error reset */ }
  }
  // Sembunyikan elemen video setelah di-reset
  videoElement.style.display = 'none'; 
  barcodeResultEl.textContent = 'Status: Kamera tidak aktif.';
  // JANGAN bersihkan productInfoEl agar hasil scan tetap terlihat
}

// --- Event listeners ---
window.addEventListener('load', () => {
  startBtn.addEventListener('click', startScanner);
  stopBtn.addEventListener('click', stopScanner);
  
  // Sembunyikan kamera secara default saat halaman dimuat
  stopScanner(); 
  barcodeResultEl.textContent = 'Status: Kamera tidak aktif.';
});
