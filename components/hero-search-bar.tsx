"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export function HeroSearchBar() {
  const router = useRouter();
  const [value, setValue] = useState("");

  const handleSearch = () => {
    const q = value.trim();
    if (!q) return;
    router.push(`/buscar?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="flex items-center overflow-hidden rounded-full bg-white shadow-lg">
      <input
        type="text"
        placeholder="Buscar servicios, proveedores..."
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleSearch();
        }}
        className="flex-1 bg-transparent px-6 py-3.5 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none sm:text-base"
      />
      <button
        onClick={handleSearch}
        aria-label="Buscar"
        className="mr-1.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#4c2f92] text-white transition-colors hover:bg-[#3d2575]"
      >
        <Search className="h-5 w-5" />
      </button>
    </div>
  );
}
