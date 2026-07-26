import Ejercicio from '../components/Ejercicio';
import { getRequestLocale, serverTranslation } from '@/i18n/server';

export async function generateMetadata() {
  const locale = await getRequestLocale();
  return { title: `${serverTranslation(locale, 'meta.exercise')} — lozana` };
}

export default function EjercicioPage() {
  return <Ejercicio />;
}
