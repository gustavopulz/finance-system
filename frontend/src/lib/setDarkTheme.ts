// src/lib/setDarkTheme.ts
export function setDarkTheme() {
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark');
  }
}
