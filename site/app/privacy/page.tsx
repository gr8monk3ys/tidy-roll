import type { Metadata } from 'next';
import LegalPage, { H2, P, UL, A } from '@/components/LegalPage';

const ISSUES = 'https://github.com/gr8monk3ys/tidy-roll/issues';

export const metadata: Metadata = {
  title: 'Privacy Policy — Tidy Roll',
  description:
    'Tidy Roll collects no personal data. No analytics, no advertising, no tracking — your photos never leave your device.',
  alternates: { canonical: '/privacy' },
};

export default function Privacy() {
  return (
    <LegalPage title="Privacy Policy" updated="July 27, 2026">
      <P>
        Tidy Roll is a photo triage app that helps you review your camera roll. We built it to be
        privacy-first and on-device by default.
      </P>

      <H2>What we collect</H2>
      <P>
        <strong className="text-fg">We do not collect personal data.</strong>
      </P>
      <UL>
        <li>We do not run analytics SDKs.</li>
        <li>We do not use advertising or tracking.</li>
        <li>We do not sell or share your data.</li>
      </UL>

      <H2>Photos and media access</H2>
      <P>
        When you grant Photos/Media permission, Tidy Roll can display items from your library so you
        can decide what to keep, delete, bookmark, or remove from an album.
      </P>
      <UL>
        <li>Your photos stay on your device unless you explicitly share or export an item.</li>
        <li>
          Deleting photos is performed using the operating system photo APIs and may require
          additional confirmation on iOS.
        </li>
        <li>If you grant limited access, the app can only see the photos you selected.</li>
      </UL>

      <H2>On-device storage</H2>
      <P>
        Tidy Roll stores basic app state locally on your device (for example: settings, progress,
        bookmark IDs, and stats). This data is not sent to us.
      </P>

      <H2>The browser extension</H2>
      <P>
        The optional browser extension requests a single permission — local storage, used for your
        settings and aggregate stats. It requests no host permissions, makes no network requests,
        and reads photos directly from the folder you pick through your browser&apos;s own picker.
      </P>

      <H2>Sharing and export</H2>
      <P>
        If you use the Share feature, the selected item is shared using your device share sheet. If
        the item is only stored in iCloud, it may need to download before it can be shared.
      </P>

      <H2>Children</H2>
      <P>
        Tidy Roll is not directed to children and does not knowingly collect data from children.
      </P>

      <H2>Changes</H2>
      <P>
        If we change this policy, we will update this page and the &ldquo;Last updated&rdquo; date
        above. Because Tidy Roll is open source, every change is also visible in the project&apos;s
        public git history.
      </P>

      <H2>Contact</H2>
      <P>
        Questions? Open an issue at <A href={ISSUES}>github.com/gr8monk3ys/tidy-roll/issues</A>. For
        security reports, please follow the private disclosure process in{' '}
        <A href="https://github.com/gr8monk3ys/tidy-roll/blob/main/SECURITY.md">SECURITY.md</A>.
      </P>
    </LegalPage>
  );
}
