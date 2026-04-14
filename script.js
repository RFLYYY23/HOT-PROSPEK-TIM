// Google Sheet Configuration
const SHEET_ID = '1oG8jcOCC9FLwKhbKE3pauQn4AH9TpeeUxvwJdDKpnuA';
const SHEET_NAME = 'Sheet1'; // Ganti sesuai nama sheet Anda jika berbeda

// Data storage
let allProspects = []; 
let filteredProspects = []; 

// Initialize
document.addEventListener('DOMContentLoaded', function() {
    loadProspectsData();
    
    // Event listeners
    document.getElementById('searchInput').addEventListener('input', filterProspects);
    document.getElementById('refreshBtn').addEventListener('click', loadProspectsData);
});

// Fetch data dari Google Sheet
async function loadProspectsData() {
    const tableBody = document.getElementById('tableBody');
    tableBody.innerHTML = '<tr><td colspan="5" class="loading">⏳ Memuat data...</td></tr>';
    
    try {
        // Gunakan Google Sheets API v4 dengan CSV export (tidak perlu API key)
        const csvUrl = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/export?format=csv&gid=0`; 
        
        const response = await fetch(csvUrl);
        const csvText = await response.text();
        
        // Parse CSV
        allProspects = parseCSV(csvText);
        filteredProspects = [...allProspects];
        
        // Tampilkan data
        displayProspects(filteredProspects);
        updateStats();
        updateLastRefreshTime();
        
    } catch (error) {
        console.error('Error loading data:', error);
        tableBody.innerHTML = '<tr><td colspan="5" class="loading">❌ Gagal memuat data. Pastikan Google Sheet bisa diakses publik.</td></tr>';
    }
}

// Parse CSV data
function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const prospects = [];
    
    // Skip header row (baris pertama)
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim());
        
        if (values.length >= 3 && values[0]) {
            prospects.push({
                nama: values[0],
                sekolah: values[1],
                tanggalJanji: values[2]
            });
        }
    }
    
    return prospects;
}

// Tampilkan data di tabel
function displayProspects(prospects) {
    const tableBody = document.getElementById('tableBody');
    
    if (prospects.length === 0) {
        tableBody.innerHTML = '<tr><td colspan="5" class="empty-state">📝 Tidak ada prospek yang ditemukan</td></tr>';
        return;
    }
    
    tableBody.innerHTML = prospects.map((prospect, index) => {
        const status = getStatusBayar(prospect.tanggalJanji);
        const statusClass = status.class;
        const statusText = status.text;
        
        return `
            <tr>
                <td>${index + 1}</td>
                <td><strong>${prospect.nama}</strong></td>
                <td>${prospect.sekolah}</td>
                <td>${formatDate(prospect.tanggalJanji)}</td>
                <td><span class="status ${statusClass}">${statusText}</span></td>
            </tr>
        `;
    }).join('');
}

// Filter prospek berdasarkan search
function filterProspects() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    
    filteredProspects = allProspects.filter(prospect => 
        prospect.nama.toLowerCase().includes(searchTerm) ||
        prospect.sekolah.toLowerCase().includes(searchTerm)
    );
    
    displayProspects(filteredProspects);
}

// Tentukan status berdasarkan tanggal janji bayar
function getStatusBayar(tanggalJanjiStr) {
    try {
        const tanggalJanji = new Date(tanggalJanjiStr);
        const hariIni = new Date();
        hariIni.setHours(0, 0, 0, 0);
        
        const selisihHari = Math.floor((tanggalJanji - hariIni) / (1000 * 60 * 60 * 24));
        
        if (selisihHari > 0) {
            return { class: 'upcoming', text: `Dalam ${selisihHari} hari` }; 
        } else if (selisihHari === 0) {
            return { class: 'upcoming', text: 'Hari Ini' }; 
        } else {
            return { class: 'overdue', text: `${Math.abs(selisihHari)} hari lalu` }; 
        }
    } catch (error) {
        return { class: 'overdue', text: 'Tanggal tidak valid' }; 
    }
}

// Format tanggal
function formatDate(dateStr) {
    try {
        const date = new Date(dateStr);
        const options = { year: 'numeric', month: 'long', day: 'numeric', locale: 'id-ID' }; 
        return date.toLocaleDateString('id-ID', options);
    } catch (error) {
        return dateStr;
    }
}

// Update statistik
function updateStats() {
    document.getElementById('totalProspect').textContent = allProspects.length;
}

// Update waktu refresh terakhir
function updateLastRefreshTime() {
    const now = new Date();
    const timeStr = now.toLocaleTimeString('id-ID');
    document.getElementById('lastUpdate').textContent = timeStr;
}
