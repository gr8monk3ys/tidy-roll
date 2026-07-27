import Image from 'next/image';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import DemoDeck from '@/components/DemoDeck';

const GITHUB = 'https://github.com/gr8monk3ys/tidy-roll';

const STEPS = [
  {
    title: 'Point it at your photos',
    body: 'Pick any folder in your browser, or open your camera roll in the mobile app. Tidy Roll never uploads a single byte.',
  },
  {
    title: 'Swipe',
    body: 'Right to keep, left to toss, down to skip the hard calls, Z to undo. A counter tracks the space you’re winning back.',
  },
  {
    title: 'Confirm',
    body: 'Review every toss on one summary screen, rescue anything with a click, then confirm. Until then, nothing touches your files.',
  },
];

const FEATURES = [
  { icon: '🗂', title: 'Safety folder by default', body: 'Tossed files move to a Tidy Roll - Tossed folder inside the folder you tidied. Deleting forever is opt-in, and it asks twice.' },
  { icon: '🔒', title: 'Radically private', body: 'No account, no server, no analytics, no network calls. The extension asks for one permission: local storage for your settings.' },
  { icon: '⌨️', title: 'Keyboard-first speed', body: 'Arrow keys drive everything. Hundreds of photos reviewed in minutes — it feels like a game, because it basically is one.' },
  { icon: '📊', title: 'Space you can see', body: 'A live “to toss” counter during the session, and lifetime stats — photos reviewed, tossed, megabytes reclaimed.' },
  { icon: '🎞', title: 'Videos too', body: 'mp4 and webm play right on the card. Sort by oldest, newest, largest — or shuffle for roulette mode.' },
  { icon: '🌐', title: 'Open source', body: 'GPL-3.0, no tracking to hide, readable in an afternoon. Audit the exact code that touches your photos.' },
];

const SHOTS = [
  { src: '/assets/screenshots/deck.webp', alt: 'The swipe deck mid-swipe with the KEEP stamp showing', caption: 'The deck — springy cards, KEEP/TOSS stamps' },
  { src: '/assets/screenshots/summary.webp', alt: 'Summary screen listing tossed photos before confirming', caption: 'The summary — nothing happens until you say so' },
  { src: '/assets/screenshots/done.webp', alt: 'Done screen with session stats', caption: 'The payoff — megabytes back, guilt gone' },
];

export default function Home() {
  return (
    <div id="top">
      <Nav />
      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-[1120px] items-center gap-12 px-6 pb-20 pt-10 md:grid-cols-[1.1fr_0.9fr]">
          <div className="flex flex-col items-center text-center md:items-start md:text-left">
            <p className="mb-3.5 text-[13px] font-bold uppercase tracking-[0.14em] text-grad-a">
              Free · Open source · No account
            </p>
            <h1 className="mb-4 text-[clamp(38px,5.4vw,60px)] font-extrabold leading-[1.05] tracking-tight">
              Swipe your camera roll <span className="text-gradient">clean</span>.
            </h1>
            <p className="mb-7 max-w-[52ch] text-lg leading-relaxed text-muted">
              Your photo library has thousands of photos you&apos;ll never look at
              again. Tidy Roll deals them out one card at a time — swipe right to
              keep, left to toss — and turns an afternoon of dread into two
              satisfying minutes.
            </p>
            <div className="flex flex-wrap justify-center gap-3.5">
              <a
                href="#get"
                className="bg-gradient-brand rounded-full px-7 py-3.5 font-bold text-white shadow-[0_10px_30px_rgba(255,90,110,0.35)] transition hover:shadow-[0_14px_40px_rgba(255,90,110,0.5)] active:scale-95"
              >
                Get Tidy Roll
              </a>
              <a
                href={GITHUB}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-line px-7 py-3.5 font-bold transition hover:border-muted active:scale-95"
              >
                Star on GitHub
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-4 text-[13.5px] text-muted">
              <li>🔒 100% on-device</li>
              <li>🗂 Nothing deleted without confirmation</li>
              <li>⌨️ Keyboard-first</li>
            </ul>
          </div>
          <DemoDeck />
        </section>

        {/* How it works */}
        <section id="how" className="mx-auto max-w-[1120px] px-6 py-18">
          <h2 className="mb-9 text-center text-[clamp(26px,3.6vw,38px)] font-extrabold tracking-tight">
            Three steps. That&apos;s the whole app.
          </h2>
          <div className="grid gap-5 md:grid-cols-3">
            {STEPS.map((step, index) => (
              <article key={step.title} className="rounded-[20px] border border-line bg-surface/65 p-6.5">
                <span className="bg-gradient-brand inline-flex h-9 w-9 items-center justify-center rounded-full text-[15px] font-extrabold text-white">
                  {index + 1}
                </span>
                <h3 className="mb-2 mt-3.5 text-lg font-bold">{step.title}</h3>
                <p className="text-[14.5px] leading-relaxed text-muted">{step.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Screenshots */}
        <section className="mx-auto max-w-[1120px] px-6 py-18">
          <h2 className="mb-9 text-center text-[clamp(26px,3.6vw,38px)] font-extrabold tracking-tight">
            Cleaning up, but make it <span className="text-gradient">satisfying</span>
          </h2>
          <div className="grid gap-4.5 md:grid-cols-3">
            {SHOTS.map((shot) => (
              <figure key={shot.src} className="m-0">
                <Image
                  src={shot.src}
                  alt={shot.alt}
                  width={640}
                  height={400}
                  className="rounded-[14px] border border-line shadow-[0_14px_40px_rgba(0,0,0,0.4)]"
                />
                <figcaption className="mt-2.5 text-center text-[13px] text-muted">{shot.caption}</figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-[1120px] px-6 py-18">
          <h2 className="mb-9 text-center text-[clamp(26px,3.6vw,38px)] font-extrabold tracking-tight">
            Built like it matters
          </h2>
          <div className="grid gap-4.5 sm:grid-cols-2 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <article
                key={feature.title}
                className="rounded-[20px] border border-line bg-surface/65 p-6 transition hover:-translate-y-0.5 hover:border-muted"
              >
                <h3 className="mb-2 text-[16.5px] font-bold">
                  {feature.icon} {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted">{feature.body}</p>
              </article>
            ))}
          </div>
        </section>

        {/* Privacy */}
        <section id="privacy" className="mx-auto max-w-[1120px] px-6 py-18 text-center">
          <h2 className="mb-6 text-[clamp(26px,3.6vw,38px)] font-extrabold tracking-tight">
            Your photos never leave your device. Period.
          </h2>
          <p className="mx-auto mb-7 max-w-[68ch] text-[16.5px] leading-[1.7] text-muted">
            Tidy Roll has no backend to send them to. The browser extension reads
            photos straight from disk through your browser&apos;s own folder picker;
            the mobile app uses the system photo library. There is no telemetry, no
            crash reporting, no ads, and no third-party SDKs — and because it&apos;s
            open source, you don&apos;t have to take our word for it.
          </p>
          <a
            href={`${GITHUB}/blob/main/PRIVACY.md`}
            target="_blank"
            rel="noreferrer"
            className="inline-block rounded-full border border-line px-7 py-3.5 font-bold transition hover:border-muted"
          >
            Read the privacy policy
          </a>
        </section>

        {/* Get it */}
        <section id="get" className="mx-auto max-w-[1120px] px-6 py-18">
          <h2 className="mb-9 text-center text-[clamp(26px,3.6vw,38px)] font-extrabold tracking-tight">
            Get Tidy Roll
          </h2>
          <div className="mx-auto grid max-w-[860px] gap-5 md:grid-cols-2">
            <article className="flex flex-col items-start gap-3 rounded-[20px] border border-line bg-surface/65 p-7">
              <h3 className="text-xl font-bold">🖥 Desktop browser</h3>
              <p className="text-[14.5px] leading-relaxed text-muted">
                Chrome, Edge, Brave, Arc, Opera — tidy any folder on your computer.
              </p>
              <a
                href={`${GITHUB}#-install`}
                target="_blank"
                rel="noreferrer"
                className="bg-gradient-brand rounded-full px-6 py-3 font-bold text-white shadow-[0_10px_30px_rgba(255,90,110,0.35)] transition hover:shadow-[0_14px_40px_rgba(255,90,110,0.5)]"
              >
                Install the extension
              </a>
              <span className="text-xs text-muted">
                Chrome Web Store listing coming soon — load-unpacked today
              </span>
            </article>
            <article className="flex flex-col items-start gap-3 rounded-[20px] border border-line bg-surface/65 p-7">
              <h3 className="text-xl font-bold">📱 Android &amp; iOS</h3>
              <p className="text-[14.5px] leading-relaxed text-muted">
                The native app tidies your actual camera roll — freed space is real space.
              </p>
              <a
                href={`${GITHUB}/tree/main/mobile`}
                target="_blank"
                rel="noreferrer"
                className="bg-gradient-brand rounded-full px-6 py-3 font-bold text-white shadow-[0_10px_30px_rgba(255,90,110,0.35)] transition hover:shadow-[0_14px_40px_rgba(255,90,110,0.5)]"
              >
                Get the mobile app
              </a>
              <span className="text-xs text-muted">
                Store releases coming soon — build with Expo today
              </span>
            </article>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
