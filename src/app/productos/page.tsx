import Productos from '../components/Productos';
import { getRequestLocale, serverTranslation } from '@/i18n/server';

export async function generateMetadata() {
  const locale = await getRequestLocale();
  return { title: `${serverTranslation(locale, 'meta.products')} — lozana` };
}

export default function ProductosPage() {
  return <Productos />;
}
