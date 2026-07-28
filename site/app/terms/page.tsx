import type { Metadata } from 'next';
import LegalPage, { H2, P, UL, A } from '@/components/LegalPage';

const ISSUES = 'https://github.com/gr8monk3ys/tidy-roll/issues';

export const metadata: Metadata = {
  title: 'Terms — Tidy Roll',
  description: 'The terms governing your use of Tidy Roll.',
  alternates: { canonical: '/terms' },
};

export default function Terms() {
  return (
    <LegalPage title="Terms" updated="July 27, 2026">
      <P>These Terms govern your use of Tidy Roll. By using the app, you agree to these Terms.</P>

      <H2>Use of the app</H2>
      <UL>
        <li>
          You are responsible for how you use Tidy Roll and for any actions you take, including
          deletion of photos.
        </li>
        <li>Tidy Roll is provided for personal use to help you review your photo library.</li>
      </UL>

      <H2>Deletions and changes to your library</H2>
      <UL>
        <li>Deletes and album removals are performed using your device photo APIs.</li>
        <li>Some actions may require additional confirmation by your operating system.</li>
        <li>Always review staged items before confirming a delete.</li>
      </UL>

      <H2>Price</H2>
      <P>
        Tidy Roll is free. There is no subscription, no advertising, and no paywall on the core
        swipe-and-clean experience.
      </P>

      <H2>Availability</H2>
      <P>We may update, change, or discontinue features at any time.</P>

      <H2>Disclaimers</H2>
      <P>
        Tidy Roll is provided &ldquo;as is&rdquo; without warranties of any kind. To the maximum
        extent permitted by law, we disclaim all warranties, including merchantability, fitness for
        a particular purpose, and non-infringement.
      </P>

      <H2>Limitation of liability</H2>
      <P>
        To the maximum extent permitted by law, we are not liable for any indirect, incidental,
        special, consequential, or punitive damages, or any loss of data, arising from your use of
        the app.
      </P>

      <H2>Licence</H2>
      <P>
        Tidy Roll is open source, released under the GNU General Public License v3.0 with an
        additional permission for app store distribution. See{' '}
        <A href="https://github.com/gr8monk3ys/tidy-roll/blob/main/LICENSE">LICENSE</A> for the full
        text.
      </P>

      <H2>Contact</H2>
      <P>
        Questions? Open an issue at <A href={ISSUES}>github.com/gr8monk3ys/tidy-roll/issues</A>.
      </P>
    </LegalPage>
  );
}
