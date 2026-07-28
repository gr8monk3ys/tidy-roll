import type { Metadata } from 'next';
import LegalPage, { H2, P, UL, A } from '@/components/LegalPage';

const REPO = 'https://github.com/gr8monk3ys/tidy-roll';

export const metadata: Metadata = {
  title: 'Support — Tidy Roll',
  description:
    'Help with Tidy Roll: permissions, deleting photos, iCloud items, and how to get in touch.',
  alternates: { canonical: '/support' },
};

export default function Support() {
  return (
    <LegalPage title="Support">
      <P>
        Tidy Roll has no accounts and no servers, so most issues come down to photo permissions or
        the operating system&apos;s own delete confirmation. Start here — and if none of this helps,
        open an issue and we&apos;ll take a look.
      </P>

      <H2>Get in touch</H2>
      <P>
        Open an issue at <A href={`${REPO}/issues`}>github.com/gr8monk3ys/tidy-roll/issues</A>. It
        is the fastest route, it is public so other people benefit from the answer, and it does not
        get lost in a spam folder. For anything security-sensitive, use the private disclosure
        process in <A href={`${REPO}/blob/main/SECURITY.md`}>SECURITY.md</A> instead.
      </P>

      <H2>Common fixes</H2>
      <UL>
        <li>
          <strong className="text-fg">Only some photos appear.</strong> You granted limited photo
          access. Open the app and tap <em className="not-italic text-fg">Select more photos</em>, or
          switch to full access in your system settings.
        </li>
        <li>
          <strong className="text-fg">Sharing an iCloud photo fails.</strong> The item is stored in
          iCloud and has to download first. Connect to Wi-Fi and try again.
        </li>
        <li>
          <strong className="text-fg">Deleting asks for confirmation again.</strong> That is iOS, not
          Tidy Roll. The system always confirms before removing photos from your library — Tidy Roll
          cannot and does not bypass it.
        </li>
        <li>
          <strong className="text-fg">Tossed files in the browser extension.</strong> By default they
          move to a <em className="not-italic text-fg">Tidy Roll - Tossed</em> folder inside the
          folder you tidied. Nothing is deleted until you empty it yourself.
        </li>
        <li>
          <strong className="text-fg">The extension won&apos;t open a folder.</strong> Folder access
          needs a Chromium-based browser (Chrome, Edge, Brave, Arc, Opera). Firefox and Safari do not
          support it yet.
        </li>
      </UL>

      <H2>Nothing is uploaded</H2>
      <P>
        Whatever the problem is, it is happening on your device — Tidy Roll has no backend to send
        your photos to. See the <A href="/privacy">privacy policy</A> for the details, or read the
        source on <A href={REPO}>GitHub</A>.
      </P>
    </LegalPage>
  );
}
