'use strict';
(() => {
  const system = window.matchMedia('(prefers-color-scheme: dark)');
  let preference = 'system';
  try { preference = localStorage.getItem('interview-theme') || 'system'; } catch {}
  if (!['system', 'light', 'dark'].includes(preference)) preference = 'system';
  function apply() {
    const dark = preference === 'dark' || (preference === 'system' && system.matches);
    document.documentElement.dataset.theme = dark ? 'dark' : 'light';
    document.querySelector('meta[name="theme-color"]').content = dark ? '#141a17' : '#245b49';
  }
  apply(); // Apply before the first paint to avoid a light flash when opening dark mode.
  system.addEventListener('change', () => { if (preference === 'system') apply(); });
  document.addEventListener('DOMContentLoaded', () => {
    const control = document.getElementById('theme-select');
    control.value = preference;
    control.addEventListener('change', () => {
      preference = control.value;
      try { localStorage.setItem('interview-theme', preference); } catch {}
      apply();
    });
  });
})();
