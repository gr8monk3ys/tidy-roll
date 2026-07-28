import Nav from '@/components/Nav';
import Footer from '@/components/Footer';

/** Shared shell for the privacy / terms / support pages. */
export default function LegalPage({
  title,
  updated,
  children,
}: {
  title: string;
  updated?: string;
  children: React.ReactNode;
}) {
  return (
    <div id="top">
      <Nav />
      <main className="mx-auto w-full max-w-[820px] px-6 pb-16 pt-8">
        <h1 className="text-[clamp(28px,4vw,40px)] font-extrabold tracking-tight">{title}</h1>
        {updated && (
          <p className="mt-2 text-[13px] font-semibold text-muted">Last updated: {updated}</p>
        )}
        <div className="mt-8 rounded-[20px] border border-line bg-surface/65 p-7">{children}</div>
      </main>
      <Footer />
    </div>
  );
}

export function H2({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2.5 mt-8 text-[13px] font-extrabold uppercase tracking-[0.08em] first:mt-0">
      {children}
    </h2>
  );
}

export function P({ children }: { children: React.ReactNode }) {
  return <p className="mb-3 text-[15px] leading-[1.7] text-muted">{children}</p>;
}

export function UL({ children }: { children: React.ReactNode }) {
  return <ul className="mb-3 list-disc space-y-1.5 pl-5 text-[15px] leading-[1.7] text-muted">{children}</ul>;
}

export function A({ href, children }: { href: string; children: React.ReactNode }) {
  const external = href.startsWith('http');
  return (
    <a
      href={href}
      {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
      className="font-semibold text-fg underline underline-offset-2 hover:text-grad-b"
    >
      {children}
    </a>
  );
}
