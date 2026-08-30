import { getImage } from 'astro:assets';
import machinesBrick from '../assets/images/machines-brick.avif';

const widths = [768, 1280, 1920];

/**
 * The hero poster is the LCP element, so it is emitted as a real responsive
 * <img> (discoverable by the preload scanner) and preloaded from <head>.
 * Both callers share this so the srcset in the markup and the one in the
 * preload hint can never drift apart.
 */
export async function getHeroPoster() {
  const variants = await Promise.all(
    widths.map((width) => getImage({ src: machinesBrick, width, format: 'avif' })),
  );

  return {
    src: variants[variants.length - 1].src,
    srcset: variants.map((variant, i) => `${variant.src} ${widths[i]}w`).join(', '),
    sizes: '100vw',
    width: machinesBrick.width,
    height: machinesBrick.height,
  };
}
