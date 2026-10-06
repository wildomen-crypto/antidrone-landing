"use client";
import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react';

type Photo = { href: string; title: string; type: 'image' };
type LightboxHost = Window & { jQuery?: { lightbox?: { open: (photos: Photo[], options: Record<string, unknown>) => void } } };

export default function PhotoGallery({ children, className, label }: { children: ReactNode; className: string; label: string }) {
  const [selection, setSelection] = useState<{ photos: Photo[]; index: number } | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    if (selection && dialog.current && !dialog.current.open) dialog.current.showModal();
  }, [selection]);
  function close() { dialog.current?.close(); setSelection(null); opener.current?.focus({ preventScroll: true }); }
  function move(offset: number) {
    setSelection(current => current ? { ...current, index: (current.index + offset + current.photos.length) % current.photos.length } : null);
  }
  function open(event: MouseEvent<HTMLDivElement>) {
    // Preserve browser modifier-click behavior, but a normal click stays on this page.
    if (event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    const link = (event.target as Element).closest<HTMLAnchorElement>('a[data-gallery-photo]');
    if (!link || !event.currentTarget.contains(link)) return;
    event.preventDefault();
    const links = Array.from(event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[data-gallery-photo]'));
    const photos: Photo[] = links.map(anchor => ({ href: anchor.href, title: anchor.getAttribute('data-photo-title') || '', type: 'image' }));
    const index = links.indexOf(link);
    // Use the existing Widgetkit plugin in Joomla's top-level viewport, not inside the tall iframe.
    try {
      const host = window.parent as LightboxHost;
      if (host !== window && host.location.origin === location.origin && host.jQuery?.lightbox?.open) {
        const motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'none' : 'elastic';
        host.jQuery.lightbox.open(photos, {
          index, transitionIn: motion, transitionOut: motion, cyclic: true,
          onComplete: () => {
            const closeButton = host.document.getElementById('lightbox-close');
            if (closeButton) {
              closeButton.tabIndex = 0; closeButton.setAttribute('role', 'button'); closeButton.setAttribute('aria-label', 'Закрыть фотографию');
              closeButton.onkeydown = event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); closeButton.click(); } };
              closeButton.focus({ preventScroll: true });
            }
          },
          onClosed: () => link.focus({ preventScroll: true }),
        });
        return;
      }
    } catch { /* Standalone/cross-origin pages use the accessible local dialog. */ }
    opener.current = link;
    setSelection({ photos, index });
  }
  const photo = selection?.photos[selection.index];
  return <>
    <div className={className} onClick={open}>{children}</div>
    <dialog ref={dialog} className="photo-gallery-dialog" aria-label={label} onCancel={event => { event.preventDefault(); close(); }}
      onClick={event => { if (event.target === event.currentTarget) close(); }}
      onKeyDown={event => { if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') { event.preventDefault(); move(event.key === 'ArrowRight' ? 1 : -1); } }}>
      {photo && <div className="photo-gallery-view">
        <button type="button" className="photo-gallery-close" aria-label="Закрыть фотографию" onClick={close}>×</button>
        <button type="button" className="photo-gallery-prev" aria-label="Предыдущая фотография" onClick={() => move(-1)}>‹</button>
        <figure><img src={photo.href} alt={photo.title} /><figcaption>{photo.title} · {selection.index + 1} / {selection.photos.length}</figcaption></figure>
        <button type="button" className="photo-gallery-next" aria-label="Следующая фотография" onClick={() => move(1)}>›</button>
      </div>}
    </dialog>
  </>;
}
