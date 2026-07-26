'use client';

import { useEffect, useState } from 'react';
import { getSignedUrl } from './uploadImage';

/**
 * Firma un path del bucket privado. Devuelve null mientras firma o si no hay path.
 * La firma vence en una hora; alcanza de sobra para una vista.
 */
export function useSignedUrl(path: string | null) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let vigente = true;
    (async () => {
      const signed = path ? await getSignedUrl(path) : null;
      if (vigente) setUrl(signed);
    })();
    return () => {
      vigente = false;
    };
  }, [path]);

  return url;
}
