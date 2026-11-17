// Two symmetric cubic segments meet at 45 degrees, with zero curvature at the straight edges.
export function cornerPath(width, height, radius) {
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

export function applyContinuousCorners() {
  if (CSS.supports('corner-shape', 'squircle')) return;
  const selector = '.app-shell, .note-card, dialog, .filters, .detail-images, .image-group-row, .image-group-form';
  const observed = new WeakSet();
  const resize = new ResizeObserver(entries => {
    for (const {target} of entries) {
      const radius = parseFloat(getComputedStyle(target).borderTopLeftRadius) || 0;
      target.style.clipPath = radius
        ? `path('${cornerPath(target.offsetWidth, target.offsetHeight, radius)}')`
        : '';
    }
  });
  function scan() {
    document.querySelectorAll(selector).forEach(element => {
      if (observed.has(element)) return;
      observed.add(element);
      resize.observe(element);
    });
  }
  new MutationObserver(scan).observe(document.querySelector('.app-shell'), {childList:true, subtree:true});
  scan();
}

if (typeof document !== 'undefined') applyContinuousCorners();
