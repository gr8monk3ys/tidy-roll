

const GITHUB = 'https://github.com/gr8monk3ys/tidy-roll';

export default function Nav() {
  return (
    <header className="mx-auto flex max-w-[1120px] items-center justify-between px-6 py-4">
      <a href="#top" className="flex items-center gap-2.5 text-lg font-extrabold tracking-tight">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo.svg" alt="" width={30} height={30} className="rounded-lg" />
        <span>Tidy Roll</span>
      </a>
      <nav className="flex items-center gap-6 text-[14.5px] font-semibold text-muted">
        <a href="#how" className="hidden transition hover:text-fg sm:block">How it works</a>
        <a href="#features" className="hidden transition hover:text-fg sm:block">Features</a>
        <a href="#privacy" className="hidden transition hover:text-fg sm:block">Privacy</a>
        <a href="#get" className="hidden transition hover:text-fg sm:block">Get it</a>
        <a href={GITHUB} target="_blank" rel="noreferrer" aria-label="GitHub" className="transition hover:text-fg">
          <svg width="18" height="18" viewBox="0 0 16 16" fill="currentColor" aria-hidden>
            <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
          </svg>
        </a>
      </nav>
    </header>
  );
}
