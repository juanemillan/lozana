import Alimentacion from '../components/Alimentacion';
import { getRequestLocale, serverTranslation } from '@/i18n/server';

export async function generateMetadata() {
  const locale = await getRequestLocale();
  return { title: `${serverTranslation(locale, 'meta.food')} — lozana` };
}

export default function AlimentacionPage() {
  return <Alimentacion />;
}
