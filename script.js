/**
 * CURSOR UNIVERSE - FINAL ENHANCED VERSION
 */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const modeDisplay = document.getElementById("current-mode");

// --- GLOBAL STATE ---
let particles = [];
let effectType = "star";
let audioEnabled = false;
let globalSize = 3;
let selectedMode = "auto";

// --- EFFECT CONFIG ---
const EFFECTS = {
    star: { color: () => `hsl(${Math.random() * 60 + 40}, 100%, 90%)`, speed: 0.96, gravity: 0, density: 3, glow: 15 },
    fire: { color: () => `hsl(${Math.random() * 30}, 100%, 50%)`, speed: 0.92, gravity: -0.15, density: 5, glow: 20 },
    water: { color: () => `hsl(${190 + Math.random() * 20}, 100%, 70%)`, speed: 0.98, gravity: 0.2, density: 4, glow: 5 },
    blackhole: { color: () => `hsl(${260 + Math.random() * 40}, 80%, 60%)`, speed: 0.99, gravity: 0, density: 8, glow: 30 },
    lightning: { color: () => `#ffffff`, speed: 0.7, gravity: 0, density: 2, glow: 40 }
};

// --- PARTICLE CLASS ---
class Particle {
    constructor(x, y, type, isBurst = false) {
        const config = EFFECTS[type];
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = Math.random() * globalSize + 1;

        const speedMult = isBurst ? 15 : 6;
        this.vx = (Math.random() - 0.5) * speedMult;
        this.vy = (Math.random() - 0.5) * speedMult;

        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.005;
        this.color = config.color();
        this.glow = config.glow;
    }

    update() {
        const config = EFFECTS[this.type];

        this.x += this.vx;
        this.y += this.vy;
        this.vx *= config.speed;
        this.vy *= config.speed;
        this.vy += config.gravity;

        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.shadowBlur = this.glow;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;

        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

// --- MODE LOGIC ---
function updateEffectZone(x) {

    if (selectedMode !== "auto") {
        effectType = selectedMode;
        modeDisplay.innerText = selectedMode.toUpperCase();
        return;
    }

    const width = window.innerWidth;

    if (x < width * 0.2) effectType = "star";
    else if (x < width * 0.4) effectType = "fire";
    else if (x < width * 0.6) effectType = "water";
    else if (x < width * 0.8) effectType = "blackhole";
    else effectType = "lightning";

    modeDisplay.innerText = effectType.toUpperCase();
}

// --- ADVANCED SOUND ENGINE ---
const AudioEngine = {
    ctx: null,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === "suspended") {
            this.ctx.resume();
        }
    },

    play(type) {
        if (!audioEnabled) return;

        this.init();

        const ctx = this.ctx;
        const now = ctx.currentTime;

        const gain = ctx.createGain();
        gain.connect(ctx.destination);

        switch(type) {

            case "star":
                this.osc(ctx, 800 + Math.random()*400, "sine", 0.05, 0.3, gain);
                break;

            case "fire":
                const bufferSize = ctx.sampleRate * 0.05;
                const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                const noise = ctx.createBufferSource();
                noise.buffer = buffer;

                const g1 = ctx.createGain();
                g1.gain.setValueAtTime(0.05, now);
                g1.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

                noise.connect(g1);
                g1.connect(gain);
                noise.start();
                break;

            case "water":
                const freq = 300 + Math.random()*200;
                const osc = ctx.createOscillator();
                const g2 = ctx.createGain();

                osc.frequency.value = freq;
                osc.type = "sine";

                g2.gain.setValueAtTime(0.05, now);
                g2.gain.exponentialRampToValueAtTime(0.001, now + 0.2);

                osc.connect(g2);
                g2.connect(gain);

                osc.start();
                osc.stop(now + 0.2);
                break;

            case "blackhole":
                this.osc(ctx, 60, "sawtooth", 0.06, 0.5, gain);
                break;

            case "lightning":
                this.osc(ctx, 120, "square", 0.1, 0.1, gain);
                this.osc(ctx, 800, "sawtooth", 0.05, 0.1, gain);
                break;
        }
    },

    osc(ctx, freq, type, vol, duration, target) {
        const osc = ctx.createOscillator();
        const g = ctx.createGain();

        osc.type = type;
        osc.frequency.value = freq;

        g.gain.setValueAtTime(vol, ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(g);
        g.connect(target);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }
};

// --- EVENTS ---
window.addEventListener("mousemove", (e) => {
    updateEffectZone(e.clientX);

    if (Math.random() > 0.95) {
        AudioEngine.play(effectType);
    }

    const config = EFFECTS[effectType];
    for (let i = 0; i < config.density; i++) {
        particles.push(new Particle(e.clientX, e.clientY, effectType));
    }
});

window.addEventListener("click", (e) => {
    AudioEngine.init();
    AudioEngine.play(effectType);

    for (let i = 0; i < 60; i++) {
        particles.push(new Particle(e.clientX, e.clientY, effectType, true));
    }
});

// --- UI CONTROLS ---
document.getElementById("toggle-audio").onclick = (e) => {
    audioEnabled = !audioEnabled;
    e.target.innerText = audioEnabled ? "ON" : "OFF";
};

document.getElementById("size-slider").oninput = (e) => {
    globalSize = parseFloat(e.target.value);
};

document.getElementById("clear-btn").onclick = () => {
    particles = [];
};

// --- MODE SELECTOR ---
const modeSelector = document.getElementById("mode-selector");

modeSelector.onchange = (e) => {
    selectedMode = e.target.value;

    if (selectedMode === "auto") {
        modeDisplay.innerText = "AUTO";
    } else {
        modeDisplay.innerText = selectedMode.toUpperCase();
    }
};

// --- ANIMATION ---
function animate() {
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles = particles.filter(p => p.life > 0);

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

// --- INIT ---
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

animate();