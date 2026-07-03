
// ==========================================================================
// 2. STATE GAME & SELECTOR GLOBAL (SYSTEM LAMA + BARU)
// ==========================================================================
let storyData = {}; // Sekarang jadi objek kosong yang akan diisi oleh JSON
let currentChapterFile = ""; // Untuk mengingat kita sedang di hari apa
let currentNode = "";
let playerName = "";
let isTyping = false;
let typingTimeout = null;
const typingSpeed = 30;
let currentBgmPath = "";
let dialogHistory = [];

const thankyouScreen = document.getElementById('thankyou-screen');
const kuesionerTitleBtn = document.getElementById('kuesioner-title-btn');
const kuesionerEndBtn = document.getElementById('kuesioner-end-btn');
const backToTitleBtn = document.getElementById('back-to-title-btn');

const sfxClick = new Audio('assets/audio/papercollect3.wav');
const sfxPencil = new Audio('assets/audio/pencilscratch.wav');

// Screen Selectors
const titleScreen = document.getElementById('title-screen');
const formScreen = document.getElementById('form-screen');
const gameScreen = document.getElementById('game-screen');
const startBtn = document.getElementById('start-btn');
const submitFormBtn = document.getElementById('submit-form-btn');
const playerNameInput = document.getElementById('player-name-input');
const nameError = document.getElementById('name-error');
const bgmPlayer = document.getElementById('bgm-player');
const container = document.getElementById('game-container');

// UI Selectors
const bgLayer = document.getElementById('bg-layer');
const stressBar = document.getElementById('stress-bar');
const focusBar = document.getElementById('focus-bar');
const charLeft = document.getElementById('char-left');
const charRight = document.getElementById('char-right');
const nameBoxLeft = document.getElementById('name-box-left');
const nameBoxRight = document.getElementById('name-box-right');
const dialogTextElem = document.getElementById('dialog-text');
const nextArrow = document.querySelector('.next-arrow');
const choicesWrapper = document.getElementById('choices-wrapper');
const questionText = document.getElementById('question-text');
const choicesContainer = document.getElementById('choices-container');
const restartBtn = document.getElementById('restart-btn');
const musicToggleBtn = document.getElementById('music-toggle-btn');
const transitionOverlay = document.getElementById('transition-overlay');
const transitionText = document.getElementById('transition-text');
const timeWidget = document.getElementById('time-widget');
const timeDay = document.getElementById('time-day');
const timeClock = document.getElementById('time-clock');
const textBoxElem = document.getElementById('textbox');

// Log Selectors
const logBtn = document.getElementById('log-btn');
const logOverlay = document.getElementById('log-overlay');
const logCloseBtn = document.getElementById('log-close-btn');
const logStream = document.getElementById('log-stream');

let currentStressVal = 50;
let currentFocusVal = 20;


// ==========================================================================
// MESIN PEMUAT CHAPTER (JSON FETCH)
// ==========================================================================
async function loadChapter(chapterFile, startNodeId) {
    try {
        const response = await fetch(chapterFile); // Minta file ke server/browser
        storyData = await response.json();         // Ubah teks JSON jadi objek JavaScript
        currentChapterFile = chapterFile;          // Catat nama file (misal: "data/kamis.json")
        showNode(startNodeId);                     // Mulai adegannya!
    } catch (error) {
        console.error("Gagal memuat file cerita:", error);
        alert("Terjadi kesalahan saat memuat cerita.");
    }
}



// ==========================================================================
// 3. LOGIKA ALUR SCREEN (SISTEM LAMA)
// ==========================================================================
startBtn.addEventListener('click', () => {
    // 🎬 DETEKSI MOBILE: Hanya jalankan fullscreen jika lebar layar di bawah 850px (HP/Tablet)
    if (window.innerWidth <= 850) {
        const elem = document.documentElement;
        if (elem.requestFullscreen) {
            elem.requestFullscreen();
        } else if (elem.webkitRequestFullscreen) { /* Safari/iOS */
            elem.webkitRequestFullscreen();
        } else if (elem.msRequestFullscreen) { /* IE11 */
            elem.msRequestFullscreen();
        }

        // Coba paksa kunci layar ke landscape (Hanya jalan di Android)
        if (screen.orientation && screen.orientation.lock) {
            screen.orientation.lock('landscape').catch(err => console.log("Kunci layar ditolak sistem."));
        }
    }

    currentStressVal = 50; 
    currentFocusVal = 20;
    stressBar.style.height = currentStressVal + "%";
    focusBar.style.height = currentFocusVal + "%";

    // -------------------------------------------
    titleScreen.classList.add('hide');
    formScreen.classList.remove('hide');
});

submitFormBtn.addEventListener('click', () => {
    const inputName = playerNameInput.value.trim();

    if (!inputName) {
        nameError.textContent = 'Nama panggilan wajib diisi.';
        nameError.classList.remove('hide');
        playerNameInput.focus();
        return;
    }

    nameError.textContent = '';
    nameError.classList.add('hide');
    playerName = inputName;


    formScreen.classList.add('hide');
    gameScreen.classList.remove('hide');
    restartBtn.classList.remove('hide');
    
    dialogHistory = []; // Reset log saat mulai baru
    
    loadChapter("kamis.json", "pelajar_kamis_start");
});

playerNameInput.addEventListener('input', () => {
    if (playerNameInput.value.trim()) {
        nameError.textContent = '';
        nameError.classList.add('hide');
    }
});

// Fungsi BGM Lama
function playBgm(audioPath) {
    if (!audioPath) return; 
    if (currentBgmPath === audioPath) return; 
    currentBgmPath = audioPath;
    bgmPlayer.src = audioPath;
    bgmPlayer.volume = 0.2;
    bgmPlayer.play().catch(e => console.log("Menunggu interaksi untuk BGM"));
}

// ==========================================================================
// Fungsi SFX 
// ==========================================================================
sfxClick.volume = 0.2; // Atur volume SFX (0.5 = 50%)
sfxPencil.volume = 0.5;
sfxPencil.loop = true;

function playClickSound() {
    // Kita "kloning" suaranya setiap kali dipanggil.
    // Ini memastikan jika pemain klik 3x dengan sangat cepat, 
    // akan ada 3 suara klik yang bertumpuk rapi tanpa saling memotong.
    const soundClone = sfxClick.cloneNode();
    soundClone.volume = 0.2; // Pastikan volume kloningan sama
    soundClone.play().catch(e => console.log("SFX ditahan oleh browser"));
}

// ==========================================================================
// SENSOR SFX UNTUK SEMUA TOMBOL
// ==========================================================================
document.addEventListener('click', (e) => {
    // Jika elemen yang diklik atau disentuh oleh pemain adalah sebuah <button>
    // Ini otomatis mencakup tombol Menu, Navigasi UI, dan Tombol Pilihan (Choices)!
    if (e.target.tagName === 'BUTTON') {
        playClickSound();
    }
});

// ==========================================================================
// MESIN UTAMA ADEGAN (SHOW NODE)
// ==========================================================================
function showNode(nodeId) {
    if (nodeId === "title_screen_back") {
        bgmPlayer.pause();
        currentBgmPath = "";
        gameScreen.classList.add('hide');
        restartBtn.classList.add('hide');

        thankyouScreen.classList.add('hide');

        titleScreen.classList.remove('hide');
        document.getElementById('player-name-input').value = "";
        return;
    }

    currentNode = nodeId;
    const node = storyData[nodeId];
    if (!node) return;

    // === 🎬 SISTEM PEMBAJAK TRANSISI ANTAR HARI ===
    if (node.nextChapter) {
        // Mainkan layar animasi hitam, lalu muat file hari berikutnya
        playTransition(node.text, () => {
            loadChapter(node.nextChapter, node.next);
        });
        return; // Hentikan proses UI normal di sini
    }

    if (node.triggerEnding) {
        playEnding(node.triggerEnding);
        return; // Hentikan sisa kode agar UI dialog tidak muncul
    }
    // ==============================================

    // 1. Putar Musik & Ganti Background
    playBgm(node.bgm);
    if (node.bg) bgLayer.style.backgroundImage = `url('${node.bg}')`;

    // 2. Ganti Placeholder [PLAYER] dengan Nama Asli
    let textFixed = node.text.replace(/\[PLAYER\]/g, playerName);
    let speakerFixed = ""; 
    if (node.speakerName) {
        speakerFixed = node.speakerName.replace(/\[PLAYER\]/g, playerName);
    }

    // 3. HUBUNGKAN WIDGET WAKTU (JAM & HARI)
    if (node.day || node.time) {
        timeWidget.classList.remove('hide'); 
        if (node.day) timeDay.innerText = node.day;
        if (node.time) timeClock.innerText = node.time;
    } else {
        timeWidget.classList.add('hide'); // Sembunyikan jika adegan tidak butuh waktu
    }

    
    // (Opsional) Filter Warna
    if (node.filter) { container.className = ""; container.classList.add(node.filter); }

    // 5. Atur Gambar Karakter
    manageImg(charLeft, node.charLeft);
    manageImg(charRight, node.charRight);

    nameBoxLeft.classList.add('hide');
    nameBoxRight.classList.add('hide');

    textBoxElem.classList.remove('state-player', 'state-npc', 'state-narrator', 'hide');

    const isNarrator = node.speakerType === 'narrator' || (!speakerFixed && node.speakerType !== 'left' && node.speakerType !== 'right');
    if (isNarrator) {
        textBoxElem.classList.add('state-narrator');
    } else if (node.speakerType === 'right') {
        textBoxElem.classList.add('state-npc');
    } else if (node.speakerType === 'left') {
        textBoxElem.classList.add('state-player');
    }
    
    if (speakerFixed !== "") {
        // Jika ada nama yang berbicara, munculkan kotaknya!
        if (node.speakerType === "left") {
            nameBoxLeft.innerText = speakerFixed;
            nameBoxLeft.classList.remove('hide');
        } else if (node.speakerType === "right") {
            nameBoxRight.innerText = speakerFixed;
            nameBoxRight.classList.remove('hide');
        }
    }

    // 7. Simpan ke Log
    pushToLog(speakerFixed || "Narator", textFixed);

    // 8. Reset Area Pilihan & Teks
    choicesWrapper.classList.add('hide');
    choicesContainer.innerHTML = "";
    dialogTextElem.className = "typewriter-font"; // Gunakan class font Noir
    dialogTextElem.style.cssText = "";
    if (node.textClass) dialogTextElem.classList.add(node.textClass);
    if (node.textStyle) dialogTextElem.style.cssText += node.textStyle;
    choicesContainer.className = "choices-grid"; 
    nextArrow.classList.add('hide');

    // 9. Efek Mengetik
    typeText(textFixed, () => {
        if (node.choices && node.choices.length > 0) {
            choicesWrapper.classList.remove('hide');
            
            textBoxElem.classList.add('hide');
            nameBoxLeft.classList.add('hide');
            nameBoxRight.classList.add('hide');

            if (node.questionText) {
                questionText.innerText = node.questionText;
                questionText.classList.remove('hide');
            } else {
                questionText.classList.add('hide');
            }

            if (node.uiLayout === "decision") {
                choicesContainer.classList.add('layout-stacked');
            } else if (node.uiLayout === "quiz") {
                choicesContainer.classList.add('layout-grid');
            } else {
                choicesContainer.classList.add('layout-stacked');
            }

            node.choices.forEach(choice => {
                const btn = document.createElement('button');
                btn.className = "ui-btn custom-hud-btn"; // Tambahkan class HUD agar tombol estetik
                // --- 🛡️ SISTEM CEK SYARAT STRESS DIMULAI ---
                // 1. Cek apakah di JSON memang diset "disabled: true" dari awal
                let isChoiceDisabled = Boolean(choice.disabled);
                
                // 2. Ambil angka Stress pemain saat ini dari meteran UI
                // parseInt berguna mengubah teks "80%" menjadi angka murni 80
                let currentStress = currentStressVal;

                // 3. Jika di JSON ada syarat maxStress, dan Stress pemain melebihinya...
                if (choice.maxStress !== undefined && currentStress > choice.maxStress) {
                    isChoiceDisabled = true; // Kunci tombolnya!
                    
                    // Opsional: Tambahkan tulisan alasan terkunci di akhir teks tombol
                    btn.innerText = choice.text.replace(/\[PLAYER\]/g, playerName) + " (Stress Terlalu Tinggi)";
                } else {
                    btn.innerText = choice.text.replace(/\[PLAYER\]/g, playerName);
                }
                // --- 🛡️ SISTEM SELESAI ---
                btn.disabled = isChoiceDisabled;
                if (isChoiceDisabled) btn.classList.add('choice-disabled');
                
                btn.onclick = (e) => {
                    if (isChoiceDisabled) {
                        e.preventDefault(); e.stopPropagation(); return;
                    }
                    e.stopPropagation();

                    modifyStats(choice.addStress || 0, choice.addFocus || 0);

                    showNode(choice.nextNode);
                };
                choicesContainer.appendChild(btn);
            });
        } else {
            if (node.next || node.checkStress) nextArrow.classList.remove('hide');
        }
    });
}

// Ganti fungsi manageImg lama Anda dengan yang baru ini:

function manageImg(elem, path) {
    if (path) { 
        // Ganti placeholder dengan nama asli
        elem.src = path.replace(/\[PLAYER\]/g, playerName); 
        
        // Munculkan gambar (Hapus class invisible)
        elem.classList.remove('invisible'); 

        // Auto-Hide jika gambar pecah (tetap pertahankan posisinya)
        elem.onerror = function() {
            this.classList.add('invisible');
            console.log("Gambar gagal dimuat dan disembunyikan: " + this.src);
        };
        
    } else { 
        // Sembunyikan gambar jika data path kosong (tetap pertahankan posisinya)
        elem.classList.add('invisible'); 
    }
}

// ==========================================================================
// FUNGSI MENGETIK SUPER MULUS (OPTIMIZED)
// ==========================================================================
// ==========================================================================
// FUNGSI MENGETIK SUPER MULUS (OPTIMIZED) + SFX TYPEWRITER
// ==========================================================================
function typeText(text, onComplete) {
    clearTimeout(typingTimeout);
    isTyping = true;
    
    const fullText = text || "";
    let idx = 0;

    dialogTextElem.textContent = "";

    // 🎵 1. MULAI SUARA PENSIL SAAT TEKS BERJALAN
    sfxPencil.currentTime = 0; // Mulai dari awal file
    sfxPencil.play().catch(e => console.log("Audio ditahan browser"));

    function render() {
        if (idx < fullText.length) {
            idx++;
            dialogTextElem.textContent = fullText.substring(0, idx);
            
            // (Tidak ada lagi perintah SFX di dalam sini, biarkan saja teks berjalan)

            typingTimeout = setTimeout(render, typingSpeed);
        } else {
            isTyping = false;
            
            // 🎵 2. HENTIKAN SUARA PENSIL SAAT TEKS SELESAI
            sfxPencil.pause(); 
            
            if (onComplete) onComplete();
        }
    }

    render();
}

// ==========================================================================
// 5. EVENT LISTENERS TAMBAHAN (Diperbarui)
// ==========================================================================
// ==========================================================================
// 5. EVENT LISTENERS TAMBAHAN
// ==========================================================================
let lastClickTime = 0; // Memori untuk mendinginkan klik

function handleDialogClick(e) {
    if (e.target.id === 'log-btn') return; // Abaikan jika klik tombol Log

    // 🛡️ SISTEM ANTI-DOUBLE CLICK (Cegah lompat dialog)
    const now = Date.now();
    if (now - lastClickTime < 200) return; // Harus jeda 0.2 detik antar klik
    lastClickTime = now;

    playClickSound();

    const node = storyData[currentNode];
    if (!node) return;

    if (isTyping) {
        clearTimeout(typingTimeout);
        isTyping = false;
        sfxPencil.pause(); 
        
        // Hentikan mesin tik, tampilkan semua teks langsung
        dialogTextElem.textContent = node.text.replace(/\[PLAYER\]/g, playerName);
        
        if (node.choices && node.choices.length > 0) {
            choicesWrapper.classList.remove('hide');
            completeNode(node);
        } else if (node.next || node.checkStress) {
            nextArrow.classList.remove('hide');
        }
    }
    else if (node && node.next) {
        // Jika teks sudah utuh, klik ini baru akan pindah ke adegan berikutnya
        showNode(node.next);
    }
    else if (node) {
        // 🛠️ PERBARUAN 2: SISTEM POLISI LALU LINTAS (AUTO-BRANCHING)
        if (node.checkStress) {
            // Jika Stress pemain lebih besar atau sama dengan batas (threshold)
            if (currentStressVal >= node.checkStress.threshold) {
                showNode(node.checkStress.highNode); // Lempar ke Ending Buruk
            } else {
                showNode(node.checkStress.lowNode);  // Lempar ke Ending Baik
            }
        } 
        else if (node.next) {
            showNode(node.next); // Lanjut normal seperti biasa
        }
    }
    // Link menuju kuesioner (Buka di tab baru)
    const linkKuesioner = "https://youtu.be/dQw4w9WgXcQ?si=LIAW8N93Q_vlmrrY";

    // Tombol kembali dari layar Thank You ke Layar Utama
    backToTitleBtn.addEventListener('click', () => {
        showNode("title_screen_back");
    });
}

// Gunakan .onclick agar mengunci perintah ini sebagai satu-satunya aksi kotak dialog!
textBoxElem.onclick = handleDialogClick;
function completeNode(node) {
    if (node.choices && node.choices.length > 0) {
        choicesWrapper.classList.remove('hide');

        textBoxElem.classList.add('hide');
        nameBoxLeft.classList.add('hide');
        nameBoxRight.classList.add('hide');

        if (node.uiLayout === "decision") {
            questionText.innerText = "Apa yang akan kamu lakukan?";
            choicesContainer.classList.add('layout-stacked');
        } else {
            questionText.innerText = "Quiz/Trivia";
            choicesContainer.classList.add('layout-grid');
        }
        node.choices.forEach(choice => {
            const btn = document.createElement('button');
            btn.className = "ui-btn custom-hud-btn";

            // --- 🛡️ SISTEM CEK SYARAT STRESS (JALUR SKIP) ---
            let isChoiceDisabled = Boolean(choice.disabled);
            let currentStress = parseInt(stressBar.style.height) || 0;
            
            if (choice.maxStress !== undefined && currentStress > choice.maxStress) {
                isChoiceDisabled = true;
                btn.innerText = choice.text.replace(/\[PLAYER\]/g, playerName) + " (Stress Terlalu Tinggi)";
            } else {
                btn.innerText = choice.text.replace(/\[PLAYER\]/g, playerName);
            }
            // --- 🛡️ SISTEM SELESAI ---            
           btn.disabled = isChoiceDisabled;
            if (isChoiceDisabled) {
                btn.classList.add('choice-disabled');
            }
            
            btn.onclick = (e) => {
                if (isChoiceDisabled) {
                    e.preventDefault();
                    e.stopPropagation();
                    return;
                }
                e.stopPropagation();

                modifyStats(choice.addStress || 0, choice.addFocus || 0);

                showNode(choice.nextNode);
            };
            choicesContainer.appendChild(btn);
        });
    } else {
        if (node.next) nextArrow.classList.remove('hide');
    }
}

function pushToLog(name, text) {
    dialogHistory.push({ name: name, text: text });
    logStream.innerHTML = dialogHistory.map(item => {
        const label = item.name === "Narator" ? "" : `<strong>${item.name}:</strong> `;
        return `<div style="margin-bottom:8px;">${label}${item.text}</div>`;
    }).join("");
}



// FITUR TOGGLE MUSIC (MUTE/UNMUTE)
let isMusicMuted = false;

musicToggleBtn.addEventListener('click', () => {
    isMusicMuted = !isMusicMuted; // Balikkan status dari true ke false atau sebaliknya
    bgmPlayer.muted = isMusicMuted; // Terapkan status ke audio player bawaan HTML

    // Ubah teks dan ikon pada tombol
    if (isMusicMuted) {
        musicToggleBtn.innerText = "🔇 BGM OFF";
    } else {
        musicToggleBtn.innerText = "🔊 BGM ON";
        
        // Pancing browser untuk memutar jika sebelumnya sempat tertahan autoplay policy
        if (bgmPlayer.paused && currentBgmPath !== "") {
            bgmPlayer.play().catch(e => console.log("Menunggu interaksi lanjutan"));
        }
    }
});

logBtn.addEventListener('click', () => logOverlay.classList.remove('hide'));
logCloseBtn.addEventListener('click', () => logOverlay.classList.add('hide'));
restartBtn.addEventListener('click', () => {
    // Bersihkan memori dan kembalikan ke angka awal game
    currentStressVal = 50; 
    currentFocusVal = 20;
    stressBar.style.height = currentStressVal + "%";
    focusBar.style.height = currentFocusVal + "%";
    
    showNode("title_screen_back");
});
    

// ==========================================================================
// FUNGSI PENAMBAHAN/PENGURANGAN STATS (ANTI-BUG / INSTANT FIX)
// ==========================================================================
function modifyStats(stressChange, focusChange) {
    // KUNCI UTAMA: Paksa input menjadi angka murni menggunakan parseInt()
    // Jika input kosong atau tidak valid, otomatis dianggap 0
    const sChange = parseInt(stressChange) || 0;
    const fChange = parseInt(focusChange) || 0;

    // Lakukan perhitungan langsung pada variabel internal game (bukan dari UI)
    currentStressVal += sChange;
    currentFocusVal += fChange;

    // 🛡️ PENGAMAN AMAN: Batasi angka ketat antara 0 sampai 100
    if (currentStressVal < 0) currentStressVal = 0;
    if (currentStressVal > 100) currentStressVal = 100;
    
    if (currentFocusVal < 0) currentFocusVal = 0;
    if (currentFocusVal > 100) currentFocusVal = 100;

    stressBar.style.height = currentStressVal + "%";
    focusBar.style.height = currentFocusVal + "%";
    

    // Simpan perubahan ke memori browser
}
    

// ==========================================================================
// FUNGSI ANIMASI TRANSISI LAYAR
// ==========================================================================
function playTransition(text, onComplete) {
    transitionText.innerText = text; // Ganti teks di tengah layar
    
    // 1. Munculkan layar hitam (Fade In)
    transitionOverlay.classList.remove('hide'); 
    
    // 2. Tunggu 3.5 detik agar pemain selesai membaca teksnya
    setTimeout(() => {
        // 3. Pudarkan layar hitam kembali (Fade Out)
        transitionOverlay.classList.add('hide'); 
        
        // 4. Tunggu 1.5 detik sampai layar benar-benar terang, baru muat hari berikutnya
        setTimeout(() => {
            if (onComplete) onComplete();
        }, 1500);
        
    }, 3500); 
}

// ==========================================================================
// FUNGSI ANIMASI ENDING (CINEMATIC FADE TO BLACK)
// ==========================================================================
function playEnding(endingTitle) {
    // 1. Matikan musik secara perlahan (langsung pause untuk amannya)
    // bgmPlayer.pause();
    // currentBgmPath = "";

    // 2. Masukkan teks judul ending ke tengah layar hitam
    // Kita gunakan HTML agar bisa membuat gaya teksnya sedikit berbeda dan lebih besar
    transitionText.innerHTML = `<span style="font-size: 2.5rem; font-family: 'Noir Stamp', sans-serif; letter-spacing: 2px;">${endingTitle}</span>`; 
    
    // 3. Munculkan layar hitam (Fade In)
    transitionOverlay.classList.remove('hide'); 

    // 4. Biarkan layar hitam selama 5 detik agar pemain meresapi ending-nya
    setTimeout(() => {
        // 5. Pudarkan layar hitam kembali (Fade Out)
        transitionOverlay.classList.add('hide'); 
        
        setTimeout(() => {
            // 6. Reset memori meteran untuk pemain berikutnya
            currentStressVal = 50; 
            currentFocusVal = 20;
            stressBar.style.height = "50%";
            focusBar.style.height = "20%";
            
            // 7. Kembali ke menu utama dan bersihkan teks transisi
            gameScreen.classList.add('hide');
            thankyouScreen.classList.remove('hide');
            transitionText.innerHTML = "";
        }, 1500); // Waktu memudar
        
    }, 10000); // Waktu tahan layar (5 detik)
}


