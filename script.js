/**
 * CURSOR UNIVERSE - CORE ENGINE
 * Features: Procedural Audio, Discovery Zones, Glassmorphism UI
 */

const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
const modeDisplay = document.getElementById("current-mode");

// --- GLOBAL STATE ---
let particles = [];
let effectType = "star";
let audioEnabled = false;
let globalSize = 3;

// --- CONFIGURATION OBJECT ---
// This centralizes all effect behaviors for easy tweaking
const EFFECTS = {
    star: { 
        color: () => `hsl(${Math.random() * 60 + 40}, 100%, 90%)`, 
        speed: 0.96, 
        gravity: 0,
        density: 3,
        glow: 15
    },
    fire: { 
        color: () => `hsl(${Math.random() * 30}, 100%, 50%)`, 
        speed: 0.92, 
        gravity: -0.15, // Rises upward
        density: 5,
        glow: 20
    },
    water: { 
        color: () => `hsl(${190 + Math.random() * 20}, 100%, 70%)`, 
        speed: 0.98, 
        gravity: 0.2, // Falls downward
        density: 4,
        glow: 5
    },
    blackhole: { 
        color: () => `hsl(${260 + Math.random() * 40}, 80%, 60%)`, 
        speed: 0.99, 
        gravity: 0,
        density: 8,
        glow: 30
    },
    lightning: { 
        color: () => `#ffffff`, 
        speed: 0.7, 
        gravity: 0,
        density: 2,
        glow: 40
    }
};

// --- PROCEDURAL SOUND ENGINE ---
const SoundEngine = {
    ctx: null,

    init() {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        }
        if (this.ctx.state === 'suspended') this.ctx.resume();
    },

    play(type) {
        if (!audioEnabled) return;
        this.init();
        
        const now = this.ctx.currentTime;
        const masterGain = this.ctx.createGain();
        masterGain.connect(this.ctx.destination);

        switch(type) {
            case 'star':
                // High-pitched crystalline chime
                this.createOsc(1200 + Math.random() * 800, 'sine', 0.03, 0.4, masterGain);
                break;

            case 'fire':
                // Short white-noise crackle
                const bufferSize = this.ctx.sampleRate * 0.05;
                const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
                const data = buffer.getChannelData(0);
                for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
                const noise = this.ctx.createBufferSource();
                noise.buffer = buffer;
                const fireGain = this.ctx.createGain();
                fireGain.gain.setValueAtTime(0.05, now);
                fireGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
                noise.connect(fireGain);
                fireGain.connect(masterGain);
                noise.start();
                break;

            case 'water':
                // Tonal "plop" with upward frequency sweep
                const freq = 300 + Math.random() * 200;
                const bubble = this.createOsc(freq, 'sine', 0.04, 0.2, masterGain, false);
                bubble.frequency.exponentialRampToValueAtTime(freq * 1.8, now + 0.15);
                bubble.start();
                bubble.stop(now + 0.2);
                break;

            case 'blackhole':
                // Deep sub-bass hum
                const low = this.createOsc(55 + Math.random() * 10, 'sawtooth', 0.06, 0.6, masterGain, false);
                const filter = this.ctx.createBiquadFilter();
                filter.type = "lowpass";
                filter.frequency.value = 150;
                low.disconnect();
                low.connect(filter);
                filter.connect(masterGain);
                low.start();
                low.stop(now + 0.6);
                break;

            case 'lightning':
                // Sharp electric "crack"
                this.createOsc(150, 'square', 0.1, 0.1, masterGain);
                this.createOsc(1000, 'sawtooth', 0.05, 0.05, masterGain);
                break;
        }
    },

    createOsc(freq, type, vol, duration, target, autoStart = true) {
        const osc = this.ctx.createOscillator();
        const g = this.ctx.createGain();
        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.ctx.currentTime);
        g.gain.setValueAtTime(vol, this.ctx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + duration);
        osc.connect(g);
        g.connect(target);
        if(autoStart) {
            osc.start();
            osc.stop(this.ctx.currentTime + duration);
        }
        return osc;
    }
};

// --- PARTICLE CLASS ---
class Particle {
    constructor(x, y, type, isBurst = false) {
        const config = EFFECTS[type];
        this.x = x;
        this.y = y;
        this.type = type;
        this.size = Math.random() * globalSize + (type === 'lightning' ? 2 : 1);
        
        // Initial velocity
        const speedMult = isBurst ? 15 : 6;
        this.vx = (Math.random() - 0.5) * speedMult;
        this.vy = (Math.random() - 0.5) * speedMult;
        
        // Blackhole specific: circular movement
        if (type === 'blackhole' && !isBurst) {
            const angle = Math.random() * Math.PI * 2;
            this.vx = Math.cos(angle) * 3;
            this.vy = Math.sin(angle) * 3;
        }

        this.life = 1.0;
        this.decay = Math.random() * 0.02 + 0.005;
        this.color = config.color();
        this.glow = config.glow;
    }

    update() {
        const config = EFFECTS[this.type];
        
        // Physics
        this.x += this.vx;
        this.y += this.vy;
        this.vx *= config.speed;
        this.vy *= config.speed;
        this.vy += config.gravity;

        // Blackhole inward pull simulation
        if (this.type === "blackhole") {
            this.vx *= 0.95;
            this.vy *= 0.95;
        }

        this.life -= this.decay;
    }

    draw() {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.shadowBlur = this.glow;
        ctx.shadowColor = this.color;
        ctx.fillStyle = this.color;
        
        ctx.beginPath();
        if (this.type === 'lightning') {
            // Lightning looks better as sharp rectangles/lines
            ctx.rect(this.x, this.y, this.size, this.size * 4);
        } else {
            ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        }
        ctx.fill();
        ctx.restore();
    }
}

// --- INTERACTION LOGIC ---
function updateEffectZone(x) {
    const width = window.innerWidth;
    let oldEffect = effectType;

    if (x < width * 0.2) effectType = "star";
    else if (x < width * 0.4) effectType = "fire";
    else if (x < width * 0.6) effectType = "water";
    else if (x < width * 0.8) effectType = "blackhole";
    else effectType = "lightning";

    if (oldEffect !== effectType) {
        modeDisplay.innerText = effectType.toUpperCase();
        // Little "chirp" when discovering a new zone
        if (audioEnabled) SoundEngine.play('star'); 
    }
}

window.addEventListener("mousemove", (e) => {
    updateEffectZone(e.clientX);
    
    // Play sound based on movement density
    if (Math.random() > 0.94) SoundEngine.play(effectType);

    const config = EFFECTS[effectType];
    for (let i = 0; i < config.density; i++) {
        particles.push(new Particle(e.clientX, e.clientY, effectType));
    }
});

window.addEventListener("click", (e) => {
    SoundEngine.init();
    SoundEngine.play(effectType);
    
    // Large Burst
    for (let i = 0; i < 60; i++) {
        particles.push(new Particle(e.clientX, e.clientY, effectType, true));
    }
});

// --- UI CONTROLS ---
document.getElementById("toggle-audio").onclick = (e) => {
    audioEnabled = !audioEnabled;
    e.target.innerText = audioEnabled ? "ON" : "OFF";
    e.target.classList.toggle("btn-active");
    if (audioEnabled) SoundEngine.init();
};

document.getElementById("size-slider").oninput = (e) => {
    globalSize = parseFloat(e.target.value);
};

document.getElementById("clear-btn").onclick = () => {
    particles = [];
};

// --- ANIMATION ENGINE ---
function animate() {
    // Motion blur effect
    ctx.fillStyle = "rgba(0, 0, 0, 0.15)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    particles = particles.filter(p => p.life > 0);
    
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

// Handle Window Resize
window.addEventListener("resize", () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
});

// Initialize
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
animate();