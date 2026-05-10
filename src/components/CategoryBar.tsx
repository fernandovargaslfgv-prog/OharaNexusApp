"use client";

import { useState, useRef, useEffect } from "react";

interface CategoryBarProps {
  onCategoryChange: (category: string) => void;
  activeCategory: string;
}

const categories = ["Shonen", "Seinen", "Romance", "Acción", "Ver todo"];

export default function CategoryBar({
  onCategoryChange,
  activeCategory,
}: CategoryBarProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScroll, setCanScroll] = useState(false);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScroll(container.scrollWidth > container.clientWidth);
    }
  }, []);

  return (
    <div className="border-b border-white/10 bg-black/50 backdrop-blur-sm px-4 py-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="relative">
          <div
            ref={scrollContainerRef}
            className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide scroll-smooth"
          >
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => onCategoryChange(category)}
                className={`whitespace-nowrap rounded-full px-5 py-2 text-sm font-semibold uppercase tracking-[0.24em] transition-all duration-300 ${
                  activeCategory === category
                    ? "bg-red-600 text-white shadow-lg shadow-red-500/20"
                    : "border border-white/10 bg-white/5 text-white hover:bg-white/10"
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
