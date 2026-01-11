"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TagAutocompleteProps {
  /** All available tags to choose from */
  availableTags: readonly string[];
  /** Currently selected tags */
  selectedTags: string[];
  /** Callback when selection changes */
  onChange: (tags: string[]) => void;
  /** Placeholder for input */
  placeholder?: string;
  /** Max suggestions to show */
  maxSuggestions?: number;
  /** Class for outer container */
  className?: string;
}

export function TagAutocomplete({
  availableTags,
  selectedTags,
  onChange,
  placeholder = "Escribe para buscar tags...",
  maxSuggestions = 10,
  className,
}: TagAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlightIdx, setHighlightIdx] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter available tags by query (case-insensitive, partial match)
  const suggestions = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return availableTags
      .filter(
        (tag) =>
          tag.toLowerCase().includes(q) && !selectedTags.includes(tag)
      )
      .slice(0, maxSuggestions);
  }, [query, availableTags, selectedTags, maxSuggestions]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Reset highlight when suggestions change
  useEffect(() => {
    setHighlightIdx(0);
  }, [suggestions.length]);

  const addTag = (tag: string) => {
    if (!selectedTags.includes(tag)) {
      onChange([...selectedTags, tag]);
    }
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  };

  const removeTag = (tag: string) => {
    onChange(selectedTags.filter((t) => t !== tag));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setHighlightIdx((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlightIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (suggestions[highlightIdx]) {
        addTag(suggestions[highlightIdx]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
    } else if (e.key === "Backspace" && query === "" && selectedTags.length > 0) {
      // Remove last tag on backspace when input is empty
      removeTag(selectedTags[selectedTags.length - 1]);
    }
  };

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {/* Selected tags */}
      {selectedTags.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-1">
          {selectedTags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="cursor-pointer pr-1"
              onClick={() => removeTag(tag)}
            >
              {tag}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          ))}
        </div>
      )}

      {/* Input */}
      <Input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => query.trim() && setOpen(true)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        autoComplete="off"
      />

      {/* Suggestions dropdown */}
      {open && suggestions.length > 0 && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover p-1 shadow-lg">
          {suggestions.map((tag, idx) => (
            <div
              key={tag}
              className={cn(
                "cursor-pointer rounded-sm px-2 py-1.5 text-sm transition-colors",
                idx === highlightIdx
                  ? "bg-accent text-accent-foreground"
                  : "hover:bg-accent/50"
              )}
              onMouseEnter={() => setHighlightIdx(idx)}
              onMouseDown={(e) => {
                e.preventDefault(); // prevent blur before click
                addTag(tag);
              }}
            >
              {tag}
            </div>
          ))}
        </div>
      )}

      {/* No results message */}
      {open && query.trim() && suggestions.length === 0 && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover p-2 text-sm text-muted-foreground shadow-lg">
          No hay tags que coincidan
        </div>
      )}
    </div>
  );
}
