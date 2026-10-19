import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('/src/assets/photos/*.{jpg,jpeg,png}', { eager: true });

export const photos: Record<string, ImageMetadata> = Object.fromEntries(
  Object.entries(files).map(([path, mod]) => [path.split('/').pop()!.replace(/\.(jpe?g|png)$/, ''), mod.default]),
);

export function photo(name: string): ImageMetadata {
  const img = photos[name];
  if (!img) throw new Error(`Missing photo "${name}" in src/assets/photos`);
  return img;
}
