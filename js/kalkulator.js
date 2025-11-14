// Ambil elemen dari HTML
const form = document.getElementById('kalkulator-form');
const resultDiv = document.getElementById('hasil-kalkulator');

// Tambahkan event listener ke form
form.addEventListener('submit', (e) => {
  e.preventDefault(); // Mencegah halaman reload
  
  // 1. Ambil semua nilai dari input
  const gender = document.querySelector('input[name="gender"]:checked').value;
  const age = parseInt(document.getElementById('age').value);
  const weight = parseFloat(document.getElementById('weight').value);
  const height = parseFloat(document.getElementById('height').value);
  const activityMultiplier = parseFloat(document.getElementById('activity').value);

  // 2. Validasi input
  if (!age || !weight || !height || !gender || !activityMultiplier) {
    alert("Harap isi semua kolom dengan benar!");
    return;
  }

  // 3. Hitung BMR (Rumus Mifflin-St Jeor)
  let bmr = 0;
  if (gender === 'male') {
    // Rumus BMR Pria
    bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
  } else {
    // Rumus BMR Wanita
    bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
  }

  // 4. Hitung TDEE (Total Kebutuhan Kalori Harian)
  const tdee = bmr * activityMultiplier;

  // 5. Tampilkan hasil di halaman
  displayResults(bmr, tdee);
});

// Fungsi untuk menampilkan hasil
function displayResults(bmr, tdee) {
  // Bulatkan angka agar mudah dibaca
  const bmrRounded = bmr.toFixed(0);
  const tdeeRounded = tdee.toFixed(0);

  resultDiv.innerHTML = `
    <div class="hasil-gizi-card">
      <div class="hasil-gizi-header">
        <h5>Kebutuhan Kalori Harian Anda (TDEE)</h5>
        <div class="hasil-gizi-total">${tdeeRounded}</div>
        <span class="hasil-gizi-unit">kKal / hari</span>
      </div>
      <div class="hasil-gizi-body">
        <p>Ini adalah total kalori yang Anda butuhkan per hari untuk <strong>mempertahankan berat badan</strong> Anda saat ini.</p>
        <hr>
        <div class="hasil-gizi-detail">
          <span>Kalori Istirahat (BMR) Anda:</span>
          <strong>${bmrRounded} kKal</strong>
        </div>
      </div>
    </div>
  `;
}