/* Temporizador independiente: calcula fases por tiempo transcurrido, no por ticks. */
(function () {
  'use strict';
  const defaults = {work: 40, rest: 20, rounds: 8};
  function validConfig(config) {
    return config && Number.isInteger(config.work) && config.work >= 1 && config.work <= 3600 &&
      Number.isInteger(config.rest) && config.rest >= 0 && config.rest <= 3600 &&
      Number.isInteger(config.rounds) && config.rounds >= 1 && config.rounds <= 99;
  }
  function soundPattern(style, done, kind = 'work') {
    const frequency = done ? 1200 : kind === 'rest' ? 750 : 1000;
    if (done) return [{at: 0, duration: style === 'marked' ? 1.2 : 0.9, frequency}];
    return style === 'marked' ? [{at: 0, duration: 0.55, frequency}] :
      [0, 0.30, 0.60].map(at => ({at, duration: 0.18, frequency}));
  }
  function totalMilliseconds(config) {
    return (config.work * config.rounds + config.rest * (config.rounds - 1)) * 1000;
  }
  function phaseAtTime(elapsed, config) {
    const total = totalMilliseconds(config);
    if (elapsed >= total) return {kind: 'done', round: config.rounds, left: 0, totalLeft: 0};
    const cycle = (config.work + config.rest) * 1000;
    const roundIndex = Math.floor(Math.max(0, elapsed) / cycle);
    const position = Math.max(0, elapsed) - roundIndex * cycle;
    const work = position < config.work * 1000;
    return {kind: work ? 'work' : 'rest', round: roundIndex + 1,
      left: Math.ceil(((work ? config.work * 1000 : cycle) - position) / 1000),
      totalLeft: Math.ceil((total - Math.max(0, elapsed)) / 1000)};
  }
  class IntervalTimer {
    constructor(config, now = () => Date.now()) {
      if (!validConfig(config)) throw new Error('Configuración no válida');
      this.config = {...config}; this.now = now; this.elapsed = 0; this.startedAt = null;
    }
    get running() { return this.startedAt !== null; }
    elapsedNow() { return this.elapsed + (this.running ? Math.max(0, this.now() - this.startedAt) : 0); }
    state() { return phaseAtTime(this.elapsedNow(), this.config); }
    start() { if (!this.running && this.state().kind !== 'done') this.startedAt = this.now(); }
    pause() { this.elapsed = Math.min(totalMilliseconds(this.config), this.elapsedNow()); this.startedAt = null; }
    reset(config = this.config) {
      if (!validConfig(config)) throw new Error('Configuración no válida');
      this.config = {...config}; this.elapsed = 0; this.startedAt = null;
    }
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = {validConfig, phaseAtTime, totalMilliseconds, IntervalTimer, soundPattern};
  if (typeof document === 'undefined') return;

  const byId = id => document.getElementById(id);
  const format = seconds => `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  let config = {...defaults};
  try { let saved = JSON.parse(localStorage.getItem('casa-interval-settings-v1')); if (validConfig(saved)) config = saved; } catch {}
  let audioSettings = {style: 'triple', volume: 70};
  try {
    const saved = JSON.parse(localStorage.getItem('casa-interval-audio-v1'));
    if (saved && ['triple', 'marked'].includes(saved.style) && Number.isFinite(saved.volume) && saved.volume >= 0 && saved.volume <= 100) audioSettings = saved;
  } catch {}
  const activeTones = new Set();
  const timer = new IntervalTimer(config);
  let tick = null, lastPhase = '', soundContext = null, wakeLock = null, lockPending = false;
  const card = document.createElement('section');
  card.className = 'interval-entry';
  card.setAttribute('aria-labelledby', 'interval-entry-title');
  card.innerHTML = `<div><div class="eyebrow">A TU RITMO</div><h2 id="interval-entry-title">Temporizador libre</h2><p>Configura trabajo, descanso y rondas para entrenar fuera de las sesiones.</p><p class="interval-preset" id="interval-summary"></p></div><button class="primary" id="open-intervals">Configurar y abrir ↗</button>`;
  const grid = byId('grid'); grid.after(card);
  const dialog = document.createElement('dialog'); dialog.id = 'interval-dialog';
  dialog.setAttribute('aria-labelledby', 'interval-title');
  dialog.innerHTML = `<div class="interval-shell" id="interval-shell">
    <header class="interval-header"><div><span class="eyebrow">MI ENTRENO ///</span><h2 id="interval-title">Temporizador libre</h2></div><div class="interval-header-actions"><button id="interval-fullscreen">Pantalla completa ⛶</button><button id="interval-close" aria-label="Cerrar y pausar temporizador">Cerrar ✕</button></div></header>
    <form id="interval-settings" class="interval-settings">
      <label>Trabajo <span>(segundos)</span><input id="interval-work" type="number" inputmode="numeric" min="1" max="3600" step="1" required value="${config.work}"></label>
      <label>Descanso <span>(segundos)</span><input id="interval-rest" type="number" inputmode="numeric" min="0" max="3600" step="1" required value="${config.rest}"></label>
      <label>Rondas <span class="rounds-spacer" aria-hidden="true">&nbsp;</span><input id="interval-rounds" type="number" inputmode="numeric" min="1" max="99" step="1" required value="${config.rounds}"></label>
      <p id="interval-plan" class="interval-plan"></p>
    </form>
    <section class="interval-display" data-phase="ready" aria-label="Cuenta atrás de intervalos">
      <p id="interval-phase" class="interval-phase" role="status" aria-live="polite">Listo para empezar</p>
      <div id="interval-time" class="interval-time" role="timer" aria-label="Tiempo del intervalo" aria-live="off">${format(config.work)}</div>
      <p class="interval-round"><span id="interval-round">Ronda 1 de ${config.rounds}</span><span id="interval-total"></span></p>
      <div class="interval-progress" aria-hidden="true"><div id="interval-progress-fill"></div></div>
    </section>
    <div class="interval-controls"><button class="primary" id="interval-start">Iniciar</button><button id="interval-reset">Reiniciar</button></div>
    <footer class="interval-footer"><label><input id="interval-sound" type="checkbox" checked> Aviso sonoro al cambiar</label><details class="interval-audio"><summary>Sonido y volumen</summary><div class="interval-audio-controls"><label for="interval-tone">Tipo de aviso<select id="interval-tone"><option value="triple">Triple pitido</option><option value="marked">Pitido marcado</option></select></label><label for="interval-volume">Volumen <output id="interval-volume-value">70 %</output><input id="interval-volume" type="range" min="0" max="100" step="5" value="70"></label><button type="button" id="interval-test-sound">Probar sonido ▶</button></div><small>El volumen también depende del volumen multimedia del móvil. El aviso final es más largo.</small></details><p id="interval-message" role="status">Al cerrar se pausa. Puedes volver a abrirlo y continuar.</p><small>Mantén la app visible para recibir los avisos. No hay descanso después de la última ronda.</small></footer>
  </div>`;
  document.body.append(dialog);

  function readConfig() { return {work: Number(byId('interval-work').value), rest: Number(byId('interval-rest').value), rounds: Number(byId('interval-rounds').value)}; }
  function saveConfig(next) {
    config = {...next};
    try { localStorage.setItem('casa-interval-settings-v1', JSON.stringify(config)); } catch {}
    byId('interval-summary').textContent = `${config.work} s trabajo / ${config.rest} s descanso · ${config.rounds} rondas`;
  }
  function releaseLock() { if (wakeLock) { wakeLock.release().catch(() => {}); wakeLock = null; } }
  async function keepAwake() {
    if (!navigator.wakeLock || wakeLock || lockPending || !timer.running || document.visibilityState !== 'visible') return;
    lockPending = true;
    try {
      const lock = await navigator.wakeLock.request('screen');
      if (!timer.running || !dialog.open) { await lock.release(); return; }
      wakeLock = lock; lock.addEventListener('release', () => { if (wakeLock === lock) wakeLock = null; });
    } catch {} finally { lockPending = false; }
  }
  function initSound() {
    try { const Audio = window.AudioContext || window.webkitAudioContext; if (Audio) { soundContext ||= new Audio(); soundContext.resume().catch(() => {}); } } catch {}
  }
  function stopSound() {
    activeTones.forEach(tone => { try { tone.stop(); } catch {} });
    activeTones.clear();
  }
  function signal(done, kind = 'work', test = false) {
    if ((!test && !byId('interval-sound').checked) || !soundContext || document.visibilityState !== 'visible' || audioSettings.volume === 0) return;
    stopSound();
    try {
      const base = soundContext.currentTime;
      for (const pulse of soundPattern(audioSettings.style, done, kind)) {
        const tone = soundContext.createOscillator(), gain = soundContext.createGain();
        tone.type = 'triangle'; tone.frequency.value = pulse.frequency;
        tone.connect(gain); gain.connect(soundContext.destination);
        const start = base + pulse.at, end = start + pulse.duration;
        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.42 * audioSettings.volume / 100, start + 0.012);
        gain.gain.setValueAtTime(0.42 * audioSettings.volume / 100, Math.max(start + 0.012, end - 0.035));
        gain.gain.linearRampToValueAtTime(0, end);
        activeTones.add(tone);
        tone.onended = () => { activeTones.delete(tone); tone.disconnect(); gain.disconnect(); };
        tone.start(start); tone.stop(end + 0.01);
      }
    } catch {}
  }
  function saveAudioSettings() {
    stopSound();
    audioSettings = {style: byId('interval-tone').value, volume: Number(byId('interval-volume').value)};
    byId('interval-volume-value').textContent = audioSettings.volume + ' %';
    try { localStorage.setItem('casa-interval-audio-v1', JSON.stringify(audioSettings)); } catch {}
  }
  byId('interval-tone').value = audioSettings.style;
  byId('interval-volume').value = audioSettings.volume;
  byId('interval-volume-value').textContent = audioSettings.volume + ' %';
  byId('interval-tone').addEventListener('change', saveAudioSettings);
  byId('interval-volume').addEventListener('input', saveAudioSettings);
  byId('interval-sound').addEventListener('change', stopSound);
  byId('interval-test-sound').addEventListener('click', () => {
    initSound();
    if (!soundContext) { byId('interval-message').textContent = 'Este navegador no permite reproducir el aviso sonoro.'; return; }
    signal(false, 'work', true);
    byId('interval-message').textContent = audioSettings.volume === 0 ? 'Sube el volumen del aviso para escucharlo.' : 'Prueba de sonido. Ajusta también el volumen multimedia de tu móvil.';
  });
  function paint() {
    const state = timer.state(), key = `${state.kind}-${state.round}`;
    if (lastPhase && lastPhase !== key && timer.running) signal(state.kind === 'done', state.kind);
    lastPhase = key;
    const started = timer.elapsedNow() > 0 || timer.running;
    const done = state.kind === 'done';
    byId('interval-time').textContent = format(state.left);
    byId('interval-total').textContent = `Total restante ${format(state.totalLeft)}`;
    byId('interval-round').textContent = `Ronda ${state.round} de ${timer.config.rounds}`;
    const label = done ? '¡Completado!' : !started ? 'Listo para empezar' : `${state.kind === 'work' ? 'Trabajo' : 'Descanso'}${timer.running ? '' : ' · En pausa'}`;
    const phase = byId('interval-phase'); if (phase.textContent !== label) phase.textContent = label;
    dialog.querySelector('.interval-display').dataset.phase = done ? 'done' : !started ? 'ready' : state.kind;
    byId('interval-start').textContent = done ? 'Finalizado' : timer.running ? 'Pausar' : started ? 'Continuar' : 'Iniciar';
    byId('interval-start').disabled = done;
    const locked = started || done;
    ['work', 'rest', 'rounds'].forEach(id => byId(`interval-${id}`).disabled = locked);
    byId('interval-progress-fill').style.width = `${Math.min(100, timer.elapsedNow() / totalMilliseconds(timer.config) * 100)}%`;
    byId('interval-plan').textContent = `${timer.config.rounds} rondas · ${format(Math.ceil(totalMilliseconds(timer.config) / 1000))} en total · Sin descanso final`;
    if (done && timer.running) { timer.pause(); stopTicks(); releaseLock(); byId('interval-message').textContent = 'Has terminado todas las rondas. Pulsa Reiniciar para empezar de nuevo.'; }
  }
  function stopTicks() { clearInterval(tick); tick = null; }
  function pause() { stopSound(); timer.pause(); stopTicks(); releaseLock(); paint(); if (timer.state().kind !== 'done') byId('interval-message').textContent = 'En pausa. Pulsa Continuar para retomar el tiempo restante.'; }
  function reset() { stopSound(); stopTicks(); releaseLock(); timer.reset(); lastPhase = ''; byId('interval-message').textContent = 'Listo. Puedes cambiar los tiempos antes de iniciar.'; paint(); }
  function applySettings() {
    if (timer.running || timer.elapsedNow() > 0) return;
    const next = readConfig();
    if (!validConfig(next)) { byId('interval-plan').textContent = 'Trabajo: 1–3600 s · Descanso: 0–3600 s · Rondas: 1–99. Usa números enteros.'; return; }
    saveConfig(next); timer.reset(next); lastPhase = ''; paint();
  }
  byId('interval-settings').addEventListener('input', applySettings);
  byId('interval-settings').addEventListener('submit', event => { event.preventDefault(); byId('interval-start').click(); });
  byId('open-intervals').addEventListener('click', () => { byId('interval-title').textContent='Temporizador libre'; dialog.showModal(); paint(); });
  byId('interval-start').addEventListener('click', () => {
    if (timer.running) { pause(); return; }
    if (!byId('interval-settings').reportValidity()) return;
    if (!timer.elapsedNow()) { const next = readConfig(); if (!validConfig(next)) return; timer.reset(next); saveConfig(next); }
    initSound(); timer.start(); keepAwake(); paint(); stopTicks(); tick = setInterval(paint, 100);
    byId('interval-message').textContent = 'Entrenamiento en marcha. Puedes pausarlo cuando lo necesites.';
  });
  byId('interval-reset').addEventListener('click', reset);
  async function leaveFullscreen() { if (document.fullscreenElement && dialog.contains(document.fullscreenElement)) { try { await document.exitFullscreen(); } catch {} } }
  byId('interval-close').addEventListener('click', async () => { pause(); await leaveFullscreen(); dialog.close(); });
  dialog.addEventListener('cancel', () => { pause(); leaveFullscreen(); });
  dialog.addEventListener('close', () => { pause(); leaveFullscreen(); });
  byId('interval-fullscreen').addEventListener('click', async () => {
    if (document.fullscreenElement) { await leaveFullscreen(); return; }
    const shell = byId('interval-shell');
    if (shell.requestFullscreen) { try { await shell.requestFullscreen(); return; } catch {} }
    byId('interval-message').textContent = 'La vista ya ocupa la pantalla disponible. Este navegador no permite ocultar sus barras.';
  });
  document.addEventListener('fullscreenchange', () => { byId('interval-fullscreen').textContent = document.fullscreenElement ? 'Salir de pantalla completa' : 'Pantalla completa ⛶'; });
  document.addEventListener('visibilitychange', () => { if (timer.running) { paint(); keepAwake(); } });
  // Evita dos temporizadores sonando a la vez al abrir una sesión.
  const previousOpenSession = window.openSession;
  window.openSession = function (...args) { if (timer.running) pause(); return previousOpenSession.apply(this, args); };
  window.openHomeIntervals = function(work, rest, rounds, title) {
    pause(); reset();
    const next={work,rest,rounds};
    timer.reset(next); saveConfig(next);
    ['work','rest','rounds'].forEach(key=>byId('interval-'+key).value=next[key]);
    byId('interval-title').textContent=title;
    dialog.showModal(); lastPhase=''; paint();
  };
  saveConfig(config); paint();
})();
