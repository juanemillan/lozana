import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'lozana — bitácora de piel',
    short_name: 'lozana',
    description: 'Rutina, alimentación, ejercicio y seguimiento de piel.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#ECE7DA',
    theme_color: '#ECE7DA',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512-maskable.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
