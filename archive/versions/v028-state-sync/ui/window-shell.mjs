// The Windows contour is a two-segment continuous-curvature approximation.
// Apple exposes style .continuous and a radius, not its rendering coefficients.
export function continuousPath(width, height, radius) {
  const r = Math.max(0, Math.min(radius, width / 2, height / 2));
  const w = width, h = height;
  return [
    `M ${r} 0 H ${w-r}`,
    `C ${w-.6*r} 0 ${w-.34*r} 0 ${w-.17*r} ${.17*r}`,
    `C ${w} ${.34*r} ${w} ${.6*r} ${w} ${r}`,
    `V ${h-r}`,
    `C ${w} ${h-.6*r} ${w} ${h-.34*r} ${w-.17*r} ${h-.17*r}`,
    `C ${w-.34*r} ${h} ${w-.6*r} ${h} ${w-r} ${h}`,
    `H ${r}`,
    `C ${.6*r} ${h} ${.34*r} ${h} ${.17*r} ${h-.17*r}`,
    `C 0 ${h-.34*r} 0 ${h-.6*r} 0 ${h-r}`,
    `V ${r}`,
    `C 0 ${.6*r} 0 ${.34*r} ${.17*r} ${.17*r}`,
    `C ${.34*r} 0 ${.6*r} 0 ${r} 0 Z`
  ].join(' ');
}

const shell = document.querySelector('.window-shell');
const bridge = window.pmgDesktop;
function contour() {
  const radius = shell.classList.contains('maximized') ? 0 : 24;
  shell.style.clipPath = `path('${continuousPath(shell.offsetWidth, shell.offsetHeight, radius)}')`;
}
new ResizeObserver(contour).observe(shell);
function update(state) {
  shell.classList.toggle('maximized', state.maximized);
  document.querySelector('#window-maximize').setAttribute('aria-label', state.maximized ? '还原窗口' : '最大化窗口');
  contour();
}
if (bridge?.windowAction) {
  document.querySelector('.window-buttons').addEventListener('click', event => {
    const action = event.target.closest('[data-window]')?.dataset.window;
    if (action) bridge.windowAction(action).then(update).catch(console.error);
  });
  bridge.onWindowState(update);
  bridge.windowState().then(update);
} else {
  document.querySelector('.window-buttons').hidden = true;
}
