const NAV = [
  { href: "#mentor", label: "Демо" },
  { href: "#cortex", label: "Кортекс" },
  { href: "#how", label: "Как это работает" },
];

export function Logo() {
  return (
    <a href="#top" className="flex items-center gap-2.5" aria-label="Foundation — на главную">
      <svg width="28" height="28" viewBox="0 0 32 32" aria-hidden>
        <circle cx="16" cy="16" r="14" fill="none" stroke="var(--sun)" strokeWidth="2" />
        <circle cx="16" cy="19" r="7" fill="var(--sun)" />
        <path d="M16 12c-1-4 2-6 4-5" fill="none" stroke="var(--sun)" strokeWidth="2" strokeLinecap="round" />
      </svg>
      <span className="font-display text-[15px] font-semibold tracking-tight">Foundation</span>
    </a>
  );
}

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="container-x flex h-16 items-center justify-between gap-4 md:h-20">
        <Logo />
        <nav aria-label="Основная навигация" className="glass hidden rounded-full px-2 py-1.5 md:block">
          <ul className="flex items-center gap-1 text-sm text-ink-2">
            {NAV.map((n) => (
              <li key={n.href}>
                <a href={n.href} className="block rounded-full px-4 py-2 transition-colors hover:bg-white/5 hover:text-ink">
                  {n.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <a href="#access" className="btn-sun !min-h-10 !px-5 text-sm">
          Ранний доступ
        </a>
      </div>
    </header>
  );
}
