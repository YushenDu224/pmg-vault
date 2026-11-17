const controls = document.querySelector('.window-actions');
const shell = document.querySelector('.app-shell');
const maximize = document.getElementById('window-maximize');
const bridge = window.pmgDesktop;

function updateWindow(state) {
  shell.classList.toggle('maximized', state.maximized);
  maximize.setAttribute('aria-label', state.maximized ? '还原窗口' : '最大化窗口');
  maximize.title = state.maximized ? '还原窗口' : '最大化窗口';
}

if (bridge?.windowAction) {
  controls.addEventListener('click', event => {
    const action = event.target.closest('[data-window]')?.dataset.window;
    if (action) bridge.windowAction(action).then(updateWindow).catch(console.error);
  });
  bridge.onWindowState(updateWindow);
  bridge.windowState().then(updateWindow);
} else {
  controls.hidden = true;
}
