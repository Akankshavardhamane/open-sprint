const canvas = document.getElementById("canvas");
const ctx = canvas.getContext("2d");
canvas.width = window.innerWidth;
canvas.height = window.innerHeight;
let particles = [];
let effectType = "star";
document.getElementById("effect").onchange = (e)=>{
effectType = e.target.value;
};
let audioCtx;
function initAudio(){
if(!audioCtx){
audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}
}
document.addEventListener("click", initAudio);
function playSparkle(){
if(!audioCtx) return;
const osc1 = audioCtx.createOscillator();
const osc2 = audioCtx.createOscillator();
const gain = audioCtx.createGain();
osc1.type="sine";
osc2.type="triangle";
osc1.frequency.value = 900 + Math.random()*200;
osc2.frequency.value = 1200 + Math.random()*200;
gain.gain.setValueAtTime(0.04,audioCtx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001,audioCtx.currentTime+0.4);
osc1.connect(gain);
osc2.connect(gain);
gain.connect(audioCtx.destination);
osc1.start();
osc2.start();
osc1.stop(audioCtx.currentTime+0.4);
osc2.stop(audioCtx.currentTime+0.4);
}

function playFire(){
if(!audioCtx) return;
const bufferSize = 2 * audioCtx.sampleRate;
const noiseBuffer = audioCtx.createBuffer(1, bufferSize, audioCtx.sampleRate);
const output = noiseBuffer.getChannelData(0);
for(let i=0;i<bufferSize;i++){
output[i] = Math.random()*2 - 1;
}
const whiteNoise = audioCtx.createBufferSource();
whiteNoise.buffer = noiseBuffer;
const gain = audioCtx.createGain();
gain.gain.value = 0.03;
whiteNoise.connect(gain);
gain.connect(audioCtx.destination);
whiteNoise.start();
whiteNoise.stop(audioCtx.currentTime+0.15);
}

function playWater(){
if(!audioCtx) return;
const osc = audioCtx.createOscillator();
const gain = audioCtx.createGain();
osc.type="sine";
osc.frequency.setValueAtTime(300 + Math.random()*100, audioCtx.currentTime);
gain.gain.setValueAtTime(0.03, audioCtx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
osc.connect(gain);
gain.connect(audioCtx.destination);
osc.start();
osc.stop(audioCtx.currentTime + 0.3);
}

function playBlackHole(){
if(!audioCtx) return;
const osc = audioCtx.createOscillator();
const gain = audioCtx.createGain();
osc.type="sawtooth";
osc.frequency.value = 80 + Math.random()*20;
gain.gain.setValueAtTime(0.02, audioCtx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
osc.connect(gain);
gain.connect(audioCtx.destination);
osc.start();
osc.stop(audioCtx.currentTime + 0.4);
}

function playLightning(){
if(!audioCtx) return;
const osc = audioCtx.createOscillator();
const gain = audioCtx.createGain();
osc.type="square";
osc.frequency.setValueAtTime(600 + Math.random()*300, audioCtx.currentTime);
gain.gain.setValueAtTime(0.04, audioCtx.currentTime);
gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
osc.connect(gain);
gain.connect(audioCtx.destination);
osc.start();
osc.stop(audioCtx.currentTime + 0.15);
}

class Particle{
constructor(x,y){
this.x=x;
this.y=y;
this.size=Math.random()*4+1;
this.vx=(Math.random()-0.5)*6;
this.vy=(Math.random()-0.5)*6;
this.life=100;

if(effectType==="star"){
this.color=`hsl(${Math.random()*60+40},100%,80%)`;
}

if(effectType==="fire"){
this.color=`hsl(${Math.random()*30},100%,50%)`;
}

if(effectType==="water"){
this.color=`hsl(200,100%,70%)`;
}

if(effectType==="blackhole"){
this.color=`hsl(${Math.random()*60+260},100%,70%)`;
}

if(effectType==="lightning"){
this.color=`hsl(210,100%,80%)`;
}
}

update(){

this.x+=this.vx;
this.y+=this.vy;

this.vx*=0.96;
this.vy*=0.96;

if(effectType==="water"){
this.vy+=0.1;
}

this.life--;
}

draw(){
ctx.beginPath();
ctx.arc(this.x,this.y,this.size,0,Math.PI*2);
ctx.fillStyle=this.color;
ctx.shadowBlur=20;
ctx.shadowColor=this.color;
ctx.fill();
}
}

canvas.addEventListener("mousemove",(e)=>{
if(effectType==="blackhole"){
for(let i=0;i<10;i++){
let angle=Math.random()*Math.PI*2;
let radius=Math.random()*80;
let p=new Particle(
e.clientX+Math.cos(angle)*radius,
e.clientY+Math.sin(angle)*radius
);
p.vx=-Math.sin(angle)*2;
p.vy=Math.cos(angle)*2;
particles.push(p);
}
playBlackHole();
return;
}
if(effectType==="lightning"){
for(let i=0;i<4;i++){
let p=new Particle(e.clientX,e.clientY);
p.size=3;
p.vx=(Math.random()-0.5)*12;
p.vy=(Math.random()-0.5)*12;
particles.push(p);
}
playLightning();
return;
}

for(let i=0;i<6;i++){
particles.push(new Particle(e.clientX,e.clientY));
}
if(effectType==="star") playSparkle();
if(effectType==="fire") playFire();
if(effectType==="water") playWater();

});

canvas.addEventListener("click",(e)=>{

for(let i=0;i<80;i++){
particles.push(new Particle(e.clientX,e.clientY));
}

});
function animate(){

ctx.fillStyle="rgba(0,0,0,0.15)";
ctx.fillRect(0,0,canvas.width,canvas.height);

particles=particles.filter(p=>p.life>0);

particles.forEach(p=>{
p.update();
p.draw();
});
requestAnimationFrame(animate);
}
animate();