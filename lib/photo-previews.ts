import { sitePath } from './site-path';

export function photoPreview(image: string, width: number) {
  const split = image.lastIndexOf('/');
  return sitePath(`${image.slice(0, split)}/previews/${image.slice(split + 1).replace(/\.png$/, '')}-${width}.webp`);
}
export function photoSrcSet(image: string, widths: readonly number[]) {
  return widths.map(width => `${photoPreview(image, width)} ${width}w`).join(', ');
}
