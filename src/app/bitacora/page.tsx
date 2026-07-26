import Bitacora from '../components/Bitacora';
import { getRequestLocale, serverTranslation } from '@/i18n/server';

export async function generateMetadata() {
  const locale = await getRequestLocale();
  return { title: `${serverTranslation(locale, 'meta.log')} — lozana` };
}

export default function BitacoraPage() {
  return <Bitacora />;
}
