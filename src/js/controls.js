'use strict';
// Keyboard, mouse and touch input -> a single input state object consumed by the game loop.
const Controls = (() => {
  const input = { mx: 0, mz: 0, jump: false, jumpPressed: false, sneak: false, lookDX: 0, lookDY: 0, mine: false, placePressed: false, hotbarDelta: 0, hotbarSelect: -1 };
  const keys = new Set();
  let canvas, isTouch = false, pointerLocked = false, enabled = true, onAction = null;
  let touchLook = null, touchMove = null, joyOrigin = null;
  const joy = { el: null, knob: null };
  let holdTimer = null, holdActive = false, tapStart = 0, lookMoved = false;

  function init(cv, opts) {
    canvas = cv; isTouch = opts.touch; onAction = opts.onAction;
    window.addEventListener('keydown', (e) => {
      if (!enabled) return;
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA')) return;
      keys.add(e.code);
      if (e.code === 'Space') { input.jumpPressed = true; e.preventDefault(); }
      if (e.code.startsWith('Digit')) { const n = parseInt(e.code.slice(5)); if (n >= 1 && n <= 9) input.hotbarSelect = n - 1; }
      if (onAction) onAction('key', e.code);
    });
    window.addEventListener('keyup', (e) => keys.delete(e.code));
    window.addEventListener('blur', () => keys.clear());
    // mouse
    cv.addEventListener('mousedown', (e) => {
      if (isTouch) return;
      if (!pointerLocked) { if (!(window.UI && UI.panelOpen) && !(window.Battle && Battle.active) && window.G && G.running) lock(); return; }
      if (!enabled) return;
      if (e.button === 0) input.mine = true;
      if (e.button === 2) input.placePressed = true;
    });
    window.addEventListener('mouseup', (e) => { if (e.button === 0) input.mine = false; });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    window.addEventListener('mousemove', (e) => {
      if (!enabled || isTouch) return;
      if (pointerLocked) { input.lookDX += e.movementX * 0.0022; input.lookDY += e.movementY * 0.0022; }
    });
    document.addEventListener('pointerlockchange', () => { pointerLocked = document.pointerLockElement === cv; if (onAction) onAction('lock', pointerLocked); });
    cv.addEventListener('wheel', (e) => { if (!enabled) return; input.hotbarDelta += Math.sign(e.deltaY); e.preventDefault(); }, { passive: false });
    // touch
    cv.addEventListener('touchstart', onTouchStart, { passive: false });
    cv.addEventListener('touchmove', onTouchMove, { passive: false });
    cv.addEventListener('touchend', onTouchEnd, { passive: false });
    cv.addEventListener('touchcancel', onTouchEnd, { passive: false });
    joy.el = document.getElementById('joy'); joy.knob = document.getElementById('joy-knob');
    // safety: when no finger is on the screen, nothing can be held
    const allUp = (e) => { if (e.touches && e.touches.length === 0) { input.touchJump = false; input.mine = false; if (touchMove) { touchMove = null; input.mx = 0; input.mz = 0; resetJoy(); } if (touchLook) { clearTimeout(holdTimer); touchLook = null; holdActive = false; } } };
    document.addEventListener('touchend', allUp, { passive: true }); document.addEventListener('touchcancel', allUp, { passive: true });
  }
  function lock() {
    try { const p = canvas.requestPointerLock(); if (p && p.catch) p.catch(() => {}); } catch (e) { /* pointer lock refused: fall back to drag look */ }
  }
  function unlock() { try { if (document.pointerLockElement) document.exitPointerLock(); } catch (e) {} }
  function setEnabled(v) { enabled = v; if (!v) { keys.clear(); input.mine = false; input.mx = input.mz = 0; touchLook = touchMove = null; resetJoy(); clearTimeout(holdTimer); holdActive = false; } }

  function onTouchStart(e) {
    if (!enabled) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      const leftSide = t.clientX < window.innerWidth * 0.42;
      if (leftSide && !touchMove) {
        touchMove = { id: t.identifier, x: t.clientX, y: t.clientY };
        // if the finger lands on the stick itself, steer from its centre; otherwise the stick jumps to the finger
        const r = joy.el ? joy.el.getBoundingClientRect() : null;
        const onStick = r && t.clientX >= r.left - 20 && t.clientX <= r.right + 20 && t.clientY >= r.top - 20 && t.clientY <= r.bottom + 20;
        if (onStick) joyOrigin = { x: r.left + r.width / 2, y: r.top + r.height / 2 };
        else { joyOrigin = { x: t.clientX, y: t.clientY }; if (joy.el) { joy.el.style.left = (t.clientX - 55) + 'px'; joy.el.style.top = (t.clientY - 55) + 'px'; joy.el.style.bottom = 'auto'; } }
        if (joy.knob) joy.knob.style.transform = 'translate(0px,0px)';
        if (joy.el) joy.el.classList.add('active');
        if (onStick) onTouchMove(e);
      } else if (!touchLook) {
        touchLook = { id: t.identifier, x: t.clientX, y: t.clientY, sx: t.clientX, sy: t.clientY };
        tapStart = performance.now(); lookMoved = false; holdActive = false;
        clearTimeout(holdTimer);
        holdTimer = setTimeout(() => { if (touchLook && !lookMoved) { holdActive = true; input.mine = true; } }, 220);
      }
    }
  }
  function onTouchMove(e) {
    if (!enabled) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (touchMove && t.identifier === touchMove.id) {
        let dx = t.clientX - joyOrigin.x, dy = t.clientY - joyOrigin.y;
        const l = Math.hypot(dx, dy), max = 48;
        if (l > max) { dx *= max / l; dy *= max / l; }
        input.mx = dx / max; input.mz = -dy / max;
        if (joy.knob) joy.knob.style.transform = `translate(${dx}px,${dy}px)`;
      } else if (touchLook && t.identifier === touchLook.id) {
        const dx = t.clientX - touchLook.x, dy = t.clientY - touchLook.y;
        if (!holdActive) {
          if (Math.hypot(t.clientX - touchLook.sx, t.clientY - touchLook.sy) > 10) lookMoved = true;
          if (lookMoved) { input.lookDX += dx * 0.0045; input.lookDY += dy * 0.0045; }
        } else {
          // while mining, allow slow look adjustments
          input.lookDX += dx * 0.0025; input.lookDY += dy * 0.0025;
        }
        touchLook.x = t.clientX; touchLook.y = t.clientY;
      }
    }
  }
  function resetJoy() { if (!joy.el) return; joy.el.classList.remove('active'); joy.el.style.left = ''; joy.el.style.top = ''; joy.el.style.bottom = ''; joy.knob.style.transform = 'translate(0px,0px)'; }
  function onTouchEnd(e) {
    if (!enabled) return;
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (touchMove && t.identifier === touchMove.id) { touchMove = null; input.mx = 0; input.mz = 0; resetJoy(); }
      else if (touchLook && t.identifier === touchLook.id) {
        clearTimeout(holdTimer);
        const dur = performance.now() - tapStart;
        if (!holdActive && !lookMoved && dur < 260) input.placePressed = true; // short tap = place / interact
        touchLook = null; holdActive = false; input.mine = false;
      }
    }
  }
  // called each frame by the game; merges keyboard state
  function poll() {
    if (!isTouch || keys.size) {
      let mx = 0, mz = 0;
      if (keys.has('KeyW') || keys.has('ArrowUp')) mz += 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) mz -= 1;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) mx -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) mx += 1;
      if (mx || mz || !isTouch) { input.mx = mx; input.mz = mz; }
      input.jump = keys.has('Space') || input.touchJump;
      input.sneak = keys.has('ShiftLeft') || keys.has('ShiftRight') || input.touchSneak;
    } else { input.jump = !!input.touchJump; input.sneak = !!input.touchSneak; }
    const snapshot = Object.assign({}, input);
    input.jumpPressed = false; input.placePressed = false; input.lookDX = 0; input.lookDY = 0; input.hotbarDelta = 0; input.hotbarSelect = -1;
    return snapshot;
  }
  return { init, poll, setEnabled, lock, unlock, input, get locked() { return pointerLocked; }, get isTouch() { return isTouch; } };
})();
