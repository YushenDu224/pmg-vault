// The China and global PMG lookup forms share these official option values.
export const GRADE_CHOICES = ['70', '69', '68', '67', '66', '65', '64', '63', '62', '61', '60', '58', '55', '53', '50', '45', '40', '35', '30', '25', '20', '15', '12', '10', '8', '6', '4', '2', '1'];
export const ADDITIONAL_GRADES = ['NonNumeric', 'NotListed'];
export const GRADE_LABELS = { NonNumeric: '非数值', NotListed: '不在表单内' };

export function initScorePicker({ input, toggle, panel, options, helper, closeButton, choices = [...GRADE_CHOICES, ...ADDITIONAL_GRADES] }) {
  const viewport = window.visualViewport;
  let referenceHeight = viewport?.height || window.innerHeight;
  let referenceWidth = viewport?.width || window.innerWidth;
  let pendingOpen = false;

  // The input remains the single value source; friendly labels map to the official query codes.
  function getValue() {
    const raw = input.value.trim();
    const namedCode = Object.keys(GRADE_LABELS).find(code => GRADE_LABELS[code] === raw);
    return namedCode || (/^\d+$/.test(raw) ? String(Number(raw)) : raw);
  }

  function syncSelection() {
    for (const button of options.querySelectorAll('[data-score]')) {
      button.setAttribute('aria-selected', String(button.dataset.score === getValue()));
    }
  }

  function validate() {
    const value = getValue();
    const numeric = Number(value);
    const validNumber = /^\d+$/.test(value) && numeric >= 1 && numeric <= 70;
    let error = '';
    if (value && !choices.includes(value)) {
      error = validNumber
        ? `${value} 未列入 PMG 官网评分清单，请核对评分，或选择“不在表单内”。`
        : '请输入 1 至 70 的整数评分，或从列表选择非数值评级。';
    }
    input.setCustomValidity(error);
    if (helper) {
      helper.textContent = error || (ADDITIONAL_GRADES.includes(value)
        ? `已选择${GRADE_LABELS[value]} · 仅预览选项，尚未执行官网查询`
        : '输入评分，或选择官网评级');
      helper.dataset.state = error ? 'invalid' : 'valid';
    }
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
    button.textContent = GRADE_LABELS[value] || value;
    button.dataset.score = value;
    button.setAttribute('role', 'option');
    button.addEventListener('click', () => {
      input.value = GRADE_LABELS[value] || value;
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
  return { close, getValue };
}
