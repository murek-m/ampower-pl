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
  window.addEventListener('resize', () => { if (window.innerWidth > 1200) close(); });
  document.documentElement.classList.add('menu-ready');
}
setupMenu();
});
