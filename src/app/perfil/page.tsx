import Perfil from '../components/Perfil';
import { getRequestLocale, serverTranslation } from '@/i18n/server';

export async function generateMetadata() {
  const locale = await getRequestLocale();
  return { title: `${serverTranslation(locale, 'meta.profile')} — lozana` };
}

export default function PerfilPage() {
  return <Perfil />;
}
