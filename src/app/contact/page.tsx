import type { Metadata } from 'next';
import { ContactForm } from '@/components/ContactForm';

export const metadata: Metadata = { title: 'Contact' };
const supportPhone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? '+255789661031';
const supportEmail = process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? 'support@silaflix.com';

export default function ContactPage() {
  return (
    <div className="wrap pt-32 pb-20 max-w-xl">
      <h1 className="font-display text-3xl mb-2">Contact us</h1>
      <p className="text-ink-faint mb-8">
        Call us at <a href={`tel:${supportPhone}`} className="text-gold">{supportPhone}</a> or email{' '}
        <a href={`mailto:${supportEmail}`} className="text-gold">{supportEmail}</a>. Support hours are configurable in the admin dashboard.
      </p>
      <ContactForm />
    </div>
  );
}
