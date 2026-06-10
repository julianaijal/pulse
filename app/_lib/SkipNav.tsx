'use client';

export default function SkipNav() {
  return (
    <a
      href="#main-content"
      className="sr-only"
      style={{ position: 'absolute', zIndex: 999 }}
      onFocus={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.clip = 'auto';
        el.style.clipPath = 'none';
        el.style.width = 'auto';
        el.style.height = 'auto';
        el.style.overflow = 'visible';
      }}
      onBlur={(e) => {
        const el = e.currentTarget as HTMLElement;
        el.style.clip = '';
        el.style.clipPath = '';
        el.style.width = '';
        el.style.height = '';
        el.style.overflow = '';
      }}
    >
      Skip to main content
    </a>
  );
}
