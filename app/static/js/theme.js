(() => {
  const STORAGE_KEY = 'gpr-theme';
  const root = document.documentElement;

  function currentTheme(){
    return root.getAttribute('data-theme') || 'dark';
  }

  function updateToggleButton(button, theme){
    if(!button) return;
    const icon = button.querySelector('.theme-toggle-icon');
    const text = button.querySelector('.theme-toggle-text');
    const isDark = theme === 'dark';
    button.setAttribute('aria-pressed', isDark ? 'true' : 'false');
    if(icon){
      icon.textContent = isDark ? '*' : 'o';
    }
    if(text){
      text.textContent = isDark ? 'Light mode' : 'Dark mode';
    }
  }

  function applyTheme(theme){
    root.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch (err) {
      // ignore storage failures
    }
    updateToggleButton(document.getElementById('themeToggle'), theme);
    root.dispatchEvent(new CustomEvent('themechange', {detail:{theme}}));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const button = document.getElementById('themeToggle');
    if(!button) return;
    updateToggleButton(button, currentTheme());
    button.addEventListener('click', () => {
      const next = currentTheme() === 'dark' ? 'light' : 'dark';
      applyTheme(next);
    });
  });
})();

