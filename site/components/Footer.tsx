

const GITHUB = 'https://github.com/gr8monk3ys/tidy-roll';

export default function Footer() {
  return (
    <footer className="mt-10 flex flex-col items-center gap-3.5 border-t border-line px-6 pb-10 pt-12">
      <div className="flex items-center gap-2 font-extrabold">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/assets/logo.svg" alt="" width={24} height={24} className="rounded-md" />
        <span>Tidy Roll</span>
      </div>
      <nav className="flex flex-wrap justify-center gap-5 text-[13.5px] text-muted">
        <a href={GITHUB} target="_blank" rel="noreferrer" className="transition hover:text-fg">GitHub</a>
        <a href={`${GITHUB}/blob/main/PRIVACY.md`} target="_blank" rel="noreferrer" className="transition hover:text-fg">Privacy</a>
        <a href={`${GITHUB}/blob/main/CHANGELOG.md`} target="_blank" rel="noreferrer" className="transition hover:text-fg">Changelog</a>
        <a href={`${GITHUB}/issues`} target="_blank" rel="noreferrer" className="transition hover:text-fg">Support</a>
      </nav>
      <p className="text-center text-[12.5px] text-muted">
        © 2026 gr8monk3ys · GPL-3.0 · Made with a suspicious number of sunset photos
      </p>
    </footer>
  );
}
