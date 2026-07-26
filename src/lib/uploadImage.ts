import imageCompression from 'browser-image-compression';
import { supabase } from './supabase';

const BUCKET = 'photos';

/**
 * Storage no acepta cualquier caracter en la key y los acentos rompen la URL firmada.
 * NFD separa la tilde de la letra, y sacar lo no-ASCII se lleva solo la tilde.
 */
function safeName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[^\x20-\x7E]/g, '')
    .replace(/[^a-zA-Z0-9.\-_]/g, '-')
    .toLowerCase();
}

/**
 * Sube al bucket privado y devuelve el **path**, no una URL.
 * El primer segmento tiene que ser el user_id: de eso dependen las policies
 * de storage.objects definidas en 004.
 */
export async function uploadImage(
  file: File,
  userId: string,
  folder: string,
): Promise<string | null> {
  const compressed = await imageCompression(file, {
    maxWidthOrHeight: 1600,
    maxSizeMB: 0.3,
    useWebWorker: true,
  });

  const path = `${userId}/${folder}/${Date.now()}-${safeName(file.name)}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, compressed);

  if (error) {
    console.error(error);
    return null;
  }

  return path;
}

/** El bucket es privado: para mostrar una imagen hay que firmar la URL. */
export async function getSignedUrl(path: string, expiresIn = 3600): Promise<string | null> {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, expiresIn);

  if (error) {
    console.error(error);
    return null;
  }

  return data.signedUrl;
}

export async function removeImage(path: string) {
  const { error } = await supabase.storage.from(BUCKET).remove([path]);
  if (error) console.error(error);
}
