// Keep numeric grades and any future non-numeric official grades in one configuration.
export const GRADE_CHOICES = Array.from({ length: 70 }, (_, index) => String(70 - index));
export const ADDITIONAL_GRADES = [];

export function initScorePicker({ input, toggle, panel, options, closeButton, choices = [...GRADE_CHOICES, ...ADDITIONAL_GRADES] }) {
  const viewport = window.visualViewport;
  let referenceHeight = viewport?.height || window.innerHeight;
  let referenceWidth = viewport?.width || window.innerWidth;
  let pendingOpen = false;

  // An official non-numeric grade can be added to the configuration without a second input value.
  if (choices.some(value => !/^\d+$/.test(value))) input.type = 'text';

  function syncSelection() {
    for (const button of options.querySelectorAll('[data-score]')) {
      button.setAttribute('aria-selected', String(button.dataset.score === input.value));
    }
  }

  function validate() {
    const value = input.value.trim();
    const numeric = Number(value);
    const validNumber = value !== '' && Number.isInteger(numeric) && numeric >= 1 && numeric <= 70;
    const validCode = ADDITIONAL_GRADES.includes(value);
    input.setCustomValidity(!value || validNumber || validCode ? '' : '请输入 1 至 70 的整数评分');
    syncSelection();
  }

  function keyboardIsOpen() {
    return Boolean(viewport && referenceHeight - viewport.height > 80);
  }

  function close() {
    pendingOpen = false;
    panel.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
  }

  function show() {
    if (document.activeElement === input || keyboardIsOpen()) return;
    pendingOpen = false;
    syncSelection();
    panel.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
  }

  toggle.addEventListener('click', () => {
    if (!panel.hidden) return close();
    pendingOpen = true;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    if (!keyboardIsOpen()) show();
  });

  options.replaceChildren(...choices.map(value => {
    const button = document.createElement('button');
    button.type = 'button';
    button.textContent = value;
    button.dataset.score = value;
    button.setAttribute('role', 'option');
    button.addEventListener('click', () => {
      input.value = value;
      input.dispatchEvent(new Event('input', { bubbles: true }));
      input.dispatchEvent(new Event('change', { bubbles: true }));
      close();
    });
    return button;
  }));

  input.addEventListener('focus', close);
  input.addEventListener('input', () => { close(); validate(); });
  input.addEventListener('change', validate);
  closeButton.addEventListener('click', close);
  document.addEventListener('focusin', event => {
    if (event.target.matches('input, textarea, [contenteditable="true"]')) close();
  });
  document.addEventListener('pointerdown', event => {
    if (!panel.contains(event.target) && !toggle.contains(event.target)) close();
  });
  document.addEventListener('keydown', event => { if (event.key === 'Escape') close(); });

  function viewportChanged() {
    const height = viewport?.height || window.innerHeight;
    const width = viewport?.width || window.innerWidth;
    if (Math.abs(width - referenceWidth) > 40) {
      referenceWidth = width;
      referenceHeight = height;
      close();
      return;
    }
    referenceHeight = Math.max(referenceHeight, height);
    if (keyboardIsOpen()) {
      panel.hidden = true;
      toggle.setAttribute('aria-expanded', 'false');
    } else if (pendingOpen) show();
  }
  viewport?.addEventListener('resize', viewportChanged);
  window.addEventListener('resize', viewportChanged);
  window.addEventListener('orientationchange', close);
  validate();
  return { close };
}
