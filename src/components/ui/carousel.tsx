'use client';

/**
 * Carousel – Image/content carousel. Scroll-based (no embla dependency).
 * Location: src/components/ui/carousel.tsx
 */

import { useRef } from 'react';
import { cn } from '@/lib/utils';

export interface CarouselProps {
  children: React.ReactNode;
  className?: string;
  showArrows?: boolean;
}

export function Carousel({ children, className = '', showArrows = true }: CarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => {
    if (scrollRef.current) scrollRef.current.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };
  return (
    <div className={cn('relative', className)}>
      {showArrows && (
        <>
          <button
            type="button"
            className="btn btn-circle btn-sm absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-base-100/80"
            onClick={() => scroll(-1)}
            aria-label="Previous"
          >
            &#8592;
          </button>
          <button
            type="button"
            className="btn btn-circle btn-sm absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-base-100/80"
            onClick={() => scroll(1)}
            aria-label="Next"
          >
            &#8594;
          </button>
        </>
      )}
      <div
        ref={scrollRef}
        className="flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 scrollbar-thin"
        style={{ scrollbarWidth: 'thin' }}
      >
        {children}
      </div>
    </div>
  );
}

export function CarouselItem({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('shrink-0 w-[280px] snap-center', className)}>
      {children}
    </div>
  );
}
