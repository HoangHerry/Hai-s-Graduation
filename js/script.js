/* ═══════════════════════════════════════════════════
   GRADUATION INVITATION – script.js
═══════════════════════════════════════════════════ */

const screen1    = document.getElementById('screen1');
const screen2    = document.getElementById('screen2');
const screen3    = document.getElementById('screen3');
const letterImg  = document.getElementById('letterImg');
const viewBtn    = document.getElementById('viewBtn');
const glassCard  = document.getElementById('glassCard');
const backBtn    = document.getElementById('backBtn');
const musicBtn   = document.getElementById('musicBtn');
const bgMusic    = document.getElementById('bgMusic');

// Theo dõi màn hình hiện tại: 1 | 2 | 3
let currentScreen = 1;
let countdownTimer = null;
let musicStarted  = false;

// ─── Nhạc nền ────────────────────────────────────
bgMusic.volume = 0;   // bắt đầu im lặng, fade in dần

function startMusic() {
    if (musicStarted) return;
    musicStarted = true;
    bgMusic.play().then(() => {
        fadeVolume(0, 0.35, 2200);   // fade in 2.2s lên vol 0.35
    }).catch(() => {});
}

// Fade volume mượt từ `from` → `to` trong `durationMs` ms
function fadeVolume(from, to, durationMs) {
    const steps    = 60;
    const interval = durationMs / steps;
    const delta    = (to - from) / steps;
    let   current  = from;
    bgMusic.volume = from;

    const id = setInterval(() => {
        current = Math.min(Math.max(current + delta, 0), 1);
        bgMusic.volume = parseFloat(current.toFixed(4));
        if (Math.abs(current - to) < 0.001) {
            bgMusic.volume = to;
            clearInterval(id);
        }
    }, interval);
}

// Nút mute/unmute
musicBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    if (!musicStarted) {
        startMusic();
        return;
    }
    if (bgMusic.muted) {
        bgMusic.muted = false;
        musicBtn.classList.remove('muted');
        musicBtn.querySelector('.music-icon').textContent = '🔊';
    } else {
        bgMusic.muted = true;
        musicBtn.classList.add('muted');
        musicBtn.querySelector('.music-icon').textContent = '🔇';
    }
});

// ─── SFX – Web Audio API (không cần file) ────────
let sfxCtx = null;

function getSfxCtx() {
    if (!sfxCtx) sfxCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (sfxCtx.state === 'suspended') sfxCtx.resume();
    return sfxCtx;
}

// Tiếng xào giấy khi mở phong bì
function playPaperOpen() {
    const ctx      = getSfxCtx();
    const duration = 0.65;
    const rate     = ctx.sampleRate;
    const buf      = ctx.createBuffer(1, Math.floor(rate * duration), rate);
    const data     = buf.getChannelData(0);

    for (let i = 0; i < data.length; i++) {
        const t   = i / data.length;
        // envelope: nhanh lên, chậm tắt
        const env = t < 0.08 ? t / 0.08 : Math.pow(1 - (t - 0.08) / 0.92, 2);
        data[i]   = (Math.random() * 2 - 1) * env * 0.45;
    }

    const src    = ctx.createBufferSource();
    src.buffer   = buf;

    const bp     = ctx.createBiquadFilter();
    bp.type      = 'bandpass';
    bp.frequency.value = 2800;
    bp.Q.value   = 1.0;

    const lp     = ctx.createBiquadFilter();
    lp.type      = 'lowpass';
    lp.frequency.value = 6000;

    const gain   = ctx.createGain();
    gain.gain.value = 0.55;

    src.connect(bp); bp.connect(lp); lp.connect(gain); gain.connect(ctx.destination);
    src.start();
}

// Tiếng chuông nhẹ khi nhấn "Xem lời mời"
function playSoftChime() {
    const ctx = getSfxCtx();
    const now = ctx.currentTime;

    // Hai nốt nhạc: sol + mi – tạo cảm giác mời gọi nhẹ nhàng
    [[784, 0], [659, 0.12]].forEach(([freq, delay]) => {
        const osc  = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.value = freq;

        const t0 = now + delay;
        gain.gain.setValueAtTime(0, t0);
        gain.gain.linearRampToValueAtTime(0.22, t0 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, t0 + 0.7);

        osc.start(t0);
        osc.stop(t0 + 0.75);
    });
}

// ─── Back button visibility ──────────────────────
function updateBackBtn() {
    if (currentScreen > 1) {
        backBtn.classList.add('visible');
    } else {
        backBtn.classList.remove('visible');
    }
}

// ════════════════════════════════════════════════
//  SCREEN 1  →  SCREEN 2
// ════════════════════════════════════════════════
screen1.addEventListener('click', () => {
    if (currentScreen !== 1) return;

    startMusic();
    playPaperOpen();

    screen1.classList.remove('active');
    screen2.classList.add('active');
    currentScreen = 2;
    updateBackBtn();

    setTimeout(() => {
        letterImg.classList.add('revealed');
        setTimeout(() => viewBtn.classList.add('show'), 650);
    }, 100);
});

// ════════════════════════════════════════════════
//  SCREEN 2  →  SCREEN 3
// ════════════════════════════════════════════════
function goToScreen3() {
    if (currentScreen !== 2) return;

    playSoftChime();

    screen2.classList.remove('active');
    screen3.classList.add('active');
    currentScreen = 3;
    updateBackBtn();

    // Scroll về đầu khi vào screen 3
    screen3.scrollTop = 0;

    setTimeout(() => {
        glassCard.classList.add('visible');
        startCountdown();
    }, 120);
}

screen2.addEventListener('click', goToScreen3);
viewBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    goToScreen3();
});

// ════════════════════════════════════════════════
//  BACK BUTTON – điều hướng ngược
// ════════════════════════════════════════════════
backBtn.addEventListener('click', (e) => {
    e.stopPropagation();

    if (currentScreen === 2) {
        // Screen 2 → Screen 1
        letterImg.classList.remove('revealed');
        viewBtn.classList.remove('show');

        screen2.classList.remove('active');
        screen1.classList.add('active');
        currentScreen = 1;
        updateBackBtn();

    } else if (currentScreen === 3) {
        // Screen 3 → Screen 2
        stopCountdown();
        glassCard.classList.remove('visible');

        screen3.classList.remove('active');
        screen2.classList.add('active');
        currentScreen = 2;
        updateBackBtn();

        // Đảm bảo screen 2 hiện đúng trạng thái
        setTimeout(() => {
            letterImg.classList.add('revealed');
            viewBtn.classList.add('show');
        }, 80);
    }
});

// ════════════════════════════════════════════════
//  COUNTDOWN
// ════════════════════════════════════════════════
function startCountdown() {
    if (countdownTimer) return;

    const target  = new Date('2026-06-25T11:00:00+07:00');
    const dEl     = document.getElementById('cdDays');
    const hEl     = document.getElementById('cdHours');
    const mEl     = document.getElementById('cdMinutes');
    const sEl     = document.getElementById('cdSeconds');
    const cdWrap  = document.getElementById('countdown');

    function pad(n) { return String(Math.max(0, n)).padStart(2, '0'); }

    function tick(el, val) {
        if (!el || el.textContent === val) return;
        el.textContent = val;
        const box = el.closest('.cd-box');
        if (!box) return;
        box.classList.remove('tick');
        void box.offsetWidth;
        box.classList.add('tick');
    }

    function update() {
        const diff = target - Date.now();
        if (diff <= 0) {
            clearInterval(countdownTimer);
            countdownTimer = null;
            cdWrap.innerHTML = '<p class="countdown-done">🎉 Hôm nay là ngày trọng đại! 🎉</p>';
            return;
        }
        tick(dEl, pad(Math.floor(diff / 86400000)));
        tick(hEl, pad(Math.floor((diff % 86400000) / 3600000)));
        tick(mEl, pad(Math.floor((diff % 3600000) / 60000)));
        tick(sEl, pad(Math.floor((diff % 60000) / 1000)));
    }

    update();
    countdownTimer = setInterval(update, 1000);
}

function stopCountdown() {
    if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
    }
    // Reset về giá trị ban đầu
    const ids = ['cdDays','cdHours','cdMinutes','cdSeconds'];
    ids.forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = '00';
    });
}
