"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";

export function ImageLightbox({
  src,
  alt,
  width,
  height,
  className,
  placeholder,
  blurDataURL,
  children,
}: {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
  placeholder?: "blur" | "empty";
  blurDataURL?: string;
  children?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, close]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full cursor-zoom-in"
      >
        <Image
          src={src}
          alt={alt}
          width={width}
          height={height}
          className={className}
          placeholder={placeholder}
          blurDataURL={blurDataURL}
        />
        <span className="absolute right-3 bottom-3 rounded-md bg-zinc-900/80 px-2 py-1 text-[10px] text-zinc-500 opacity-0 backdrop-blur-sm transition group-hover:opacity-100 sm:hidden">
          Tap to expand
        </span>
      </button>
      {children}
      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950/90 backdrop-blur-sm"
          onClick={close}
        >
          <button
            onClick={close}
            className="absolute top-4 right-4 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-800/80 text-zinc-400 transition hover:bg-zinc-700 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="max-h-[90vh] max-w-[95vw] overflow-auto" onClick={(e) => e.stopPropagation()}>
            <Image
              src={src}
              alt={alt}
              width={width}
              height={height}
              className="h-auto w-auto max-w-none"
              quality={95}
            />
          </div>
        </div>
      )}
    </>
  );
}
