// Run before first paint; navigation remains expanded when JavaScript is disabled.
document.documentElement.classList.add('menu-ready');
document.addEventListener('DOMContentLoaded', () => {
const $ = id => document.getElementById(id);
function setupMenu() {
  const toggle = document.querySelector('.nav-toggle');
  const links = $('nav-links');
  const close = () => { links.classList.remove('is-open'); toggle.setAttribute('aria-expanded', 'false'); toggle.setAttribute('aria-label', 'Otwórz menu'); };
  toggle.addEventListener('click', () => {
    const opened = links.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(opened));
    toggle.setAttribute('aria-label', opened ? 'Zamknij menu' : 'Otwórz menu');
  });
  links.addEventListener('click', event => { if (event.target.closest('a')) close(); });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { close(); toggle.focus(); } });
  // Chromium may blur a control hidden by the breakpoint before delivering resize.
  document.addEventListener('focusout', event => {
    if (event.relatedTarget) return;
    const hiddenLink = links.contains(event.target) && getComputedStyle(links).display === 'none';
    const hiddenToggle = event.target === toggle && getComputedStyle(toggle).display === 'none';
    if (hiddenLink || hiddenToggle) queueMicrotask(() => {
      if (document.activeElement === document.body) (hiddenLink ? toggle : links.querySelector('a'))?.focus();
    });
  });
  window.addEventListener('resize', () => {
    if (window.innerWidth > 1200) close();
    if (links.contains(document.activeElement) && getComputedStyle(links).display === 'none') toggle.focus();
    else if (document.activeElement === toggle && getComputedStyle(toggle).display === 'none') links.querySelector('a')?.focus();
  });
  document.documentElement.classList.add('menu-ready');
}
setupMenu();
});
