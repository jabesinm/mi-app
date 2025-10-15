// App simple para educación inicial con sonidos
const $ = sel => document.querySelector(sel);
const $$ = sel => Array.from(document.querySelectorAll(sel));

const screens = { menu: $('#menu'), colores: $('#colores'), formas: $('#formas'), contar: $('#contar') };
const feedback = $('#feedback');
const soundToggle = $('#sound-toggle');

let audioCtx = null;
let soundsEnabled = true;

function ensureAudio(){
  if(audioCtx) return;
  try{
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }catch(e){ console.warn('WebAudio no soportado'); audioCtx = null; }
}

function playBeep(freq, time = 0.12, type = 'sine', gain = 0.12){
  if(!soundsEnabled) return;
  if(!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type; o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g); g.connect(audioCtx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + time);
  o.stop(audioCtx.currentTime + time + 0.02);
}

function playCorrect(){ playBeep(880, 0.18, 'sine', 0.14); setTimeout(()=> playBeep(1320, 0.12, 'sine', 0.1), 90); }
function playIncorrect(){ playBeep(220, 0.18, 'sawtooth', 0.12); }
function playTap(){ playBeep(520, 0.08, 'triangle', 0.08); }

function loadSoundSetting(){ const v = localStorage.getItem('ei_sonidos'); if(v!==null) soundsEnabled = v === '1'; updateSoundButton(); }
function saveSoundSetting(){ localStorage.setItem('ei_sonidos', soundsEnabled ? '1' : '0'); }
function updateSoundButton(){ if(!soundToggle) return; soundToggle.setAttribute('aria-pressed', soundsEnabled ? 'true' : 'false'); soundToggle.textContent = (soundsEnabled ? '🔊 Sonidos' : '🔈 Silencio'); }

function showScreen(name){ Object.values(screens).forEach(s => s.classList.add('hidden')); screens[name].classList.remove('hidden'); feedback.textContent = ''; feedback.className = 'feedback'; }

// ---- MENU
$$('.big-btn').forEach(b => b.addEventListener('click', e => {
  ensureAudio();
  playTap();
  const game = e.currentTarget.dataset.game;
  showScreen(game);
  if(game === 'colores') startColores();
  if(game === 'formas') startFormas();
  if(game === 'contar') startContar();
}));
$$('.back-btn').forEach(b => b.addEventListener('click', () => { playTap(); showScreen('menu'); }));

// ---- COLORES
const colores = [ {name:'Rojo', code:'#ff6b6b'}, {name:'Azul', code:'#4d79ff'}, {name:'Amarillo', code:'#ffd93d'}, {name:'Verde', code:'#4ecdc4'} ];
function startColores(){
  const target = colores[Math.floor(Math.random()*colores.length)];
  $('#target-color-name').textContent = target.name;
  const row = $('#colors-row'); row.innerHTML = '';
  const choices = shuffleArray(colores).slice(0,4);
  choices.forEach(c => {
    const el = document.createElement('div'); el.className='choice'; el.style.background = c.code; el.setAttribute('data-name', c.name);
    el.addEventListener('click', () => {
      playTap();
      if(c.name === target.name){ playCorrect(); showGood('¡Correcto!'); startColores(); } else { playIncorrect(); showBad('Intenta otra vez'); }
    });
    row.appendChild(el);
  });
}

// ---- FORMAS
const shapes = [ {name:'Círculo', cls:'circle'}, {name:'Cuadrado', cls:'square'}, {name:'Triángulo', cls:'triangle'} ];
function startFormas(){
  const target = shapes[Math.floor(Math.random()*shapes.length)];
  $('#target-shape-name').textContent = target.name;
  const row = $('#shapes-row'); row.innerHTML = '';
  const choices = shuffleArray(shapes).slice(0,3);
  choices.forEach(s => {
    const el = document.createElement('div'); el.className='choice';
    const shape = document.createElement('div'); shape.className = 'shape ' + s.cls;
    if(s.cls === 'triangle') shape.style.borderBottomColor = '#ff6b6b';
    else if(s.cls === 'circle') shape.style.background = '#4ecdc4';
    else shape.style.background = '#4d79ff';
    el.appendChild(shape);
    el.addEventListener('click', () => {
      playTap();
      if(s.name === target.name){ playCorrect(); showGood('¡Bien!'); startFormas(); } else { playIncorrect(); showBad('Prueba otra'); }
    });
    row.appendChild(el);
  });
}

// ---- CONTAR
function startContar(){
  const row = $('#count-items'); const answers = $('#count-answers'); row.innerHTML = ''; answers.innerHTML = '';
  const n = randInt(1,5);
  for(let i=0;i<n;i++){ const el = document.createElement('div'); el.className='choice'; el.textContent = '🍎'; el.style.fontSize = '32px'; el.style.display='flex'; el.style.alignItems='center'; el.style.justifyContent='center'; el.style.width='56px'; el.style.height='56px'; row.appendChild(el); }
  for(let k=1;k<=5;k++){ const btn = document.createElement('div'); btn.className='choice'; btn.textContent = k; btn.addEventListener('click', () => { playTap(); if(k===n) { playCorrect(); showGood('¡Correcto!'); startContar(); } else { playIncorrect(); showBad('No es correcto'); } }); answers.appendChild(btn); }
}

// ---- UTIL
function shuffleArray(a){ return a.slice().sort(()=> Math.random()-0.5); }
function randInt(min,max){ return Math.floor(Math.random()*(max-min+1))+min; }
function showGood(msg){ feedback.textContent = msg; feedback.className='feedback good'; }
function showBad(msg){ feedback.textContent = msg; feedback.className='feedback bad'; }

// Sound toggle
if(soundToggle){
  loadSoundSetting();
  soundToggle.addEventListener('click', () => { ensureAudio(); soundsEnabled = !soundsEnabled; updateSoundButton(); saveSoundSetting(); if(soundsEnabled) playTap(); });
}

// Init
loadSoundSetting();
showScreen('menu');

// ---- QR generation (simple)
const qrBtn = $('#qr-btn');
const qrModal = $('#qr-modal');
const qrClose = $('#qr-close');
const qrImage = $('#qr-image');
const qrDownload = $('#qr-download');
let qrObjectUrl = null;

if(qrBtn){
  qrBtn.addEventListener('click', () => {
    const url = location.href;
    qrImage.innerHTML = '';
    // Use local QRCode library if available
    try{
      if(typeof QRCode === 'function'){
        // the library will append a canvas/image into the container
        new QRCode(qrImage).makeCode(url);
      }else{
        qrImage.textContent = url;
      }
    }catch(e){
      qrImage.textContent = url;
    }
    qrModal.classList.remove('hidden');
    // prepare download link (canvas or image created by QR library)
    function enableQrDownload(){
      if(!qrDownload) return;
      qrDownload.classList.add('hidden');
      qrDownload.removeAttribute('href');
      // revoke previous object URL
      if(qrObjectUrl){ URL.revokeObjectURL(qrObjectUrl); qrObjectUrl = null; }
      const canvas = qrImage.querySelector('canvas');
      if(canvas){
        try{
          const dataUrl = canvas.toDataURL('image/png');
          qrDownload.href = dataUrl;
          qrDownload.classList.remove('hidden');
          return;
        }catch(e){ /* ignore */ }
      }
      const img = qrImage.querySelector('img');
      if(img){
        if(img.src && img.src.startsWith('data:')){
          qrDownload.href = img.src; qrDownload.classList.remove('hidden'); return;
        }
        // fetch remote image and create object URL for download
        if(img.src){
          fetch(img.src).then(r => r.blob()).then(blob => {
            qrObjectUrl = URL.createObjectURL(blob);
            qrDownload.href = qrObjectUrl;
            qrDownload.classList.remove('hidden');
          }).catch(()=>{});
          return;
        }
      }
      // try again shortly in case QR lib hasn't injected the element yet
      setTimeout(enableQrDownload, 100);
    }
    enableQrDownload();
  });
}
if(qrClose) qrClose.addEventListener('click', () => qrModal.classList.add('hidden'));
// clicking outside modal-content closes
if(qrModal) qrModal.addEventListener('click', (e) => { if(e.target === qrModal) qrModal.classList.add('hidden'); });

// clean up when modal hides: revoke any object URL and hide download link
const observer = new MutationObserver(() => {
  if(qrModal.classList.contains('hidden')){
    if(qrObjectUrl){ URL.revokeObjectURL(qrObjectUrl); qrObjectUrl = null; }
    if(qrDownload) qrDownload.classList.add('hidden');
  }
});
observer.observe(qrModal, { attributes: true, attributeFilter: ['class'] });
