"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import type { ItemSearchApiResponse, ItemSearchResult } from "@/lib/graph/types";
import { useGraphStore } from "@/stores/graph-store";

const DEBOUNCE_MS = 280;
const MIN_QUERY_LENGTH = 2;

function tierBadgeClass(tier: string | null): string {
  switch (tier) {
    case "LEGENDARY":
      return "text-amber-400";
    case "EPIC":
      return "text-violet-400";
    case "RARE":
      return "text-sky-400";
    case "UNCOMMON":
      return "text-emerald-400";
    default:
      return "text-zinc-500";
  }
}

export interface ItemSearchProps {
  className?: string;
}

export function ItemSearch({ className }: ItemSearchProps) {
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  const setTarget = useGraphStore((s) => s.setTarget);
  const targetInternalId = useGraphStore((s) => s.targetInternalId);
  const isGraphLoading = useGraphStore((s) => s.isLoading);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ItemSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);

  const showDropdown =
    isOpen && query.trim().length >= MIN_QUERY_LENGTH && !isSearching;

  const selectItem = useCallback(
    (item: ItemSearchResult) => {
      setQuery(item.displayName);
      setSelectedLabel(item.displayName);
      setIsOpen(false);
      setResults([]);
      setSearchError(null);
      void setTarget(item.internalId);
    },
    [setTarget],
  );

  useEffect(() => {
    const q = query.trim();

    if (q.length < MIN_QUERY_LENGTH) {
      setResults([]);
      setSearchError(null);
      setIsSearching(false);
      return;
    }

    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      setIsSearching(true);
      setSearchError(null);

      const params = new URLSearchParams({ q, limit: "20" });
      fetch(`/api/items/search?${params}`, { signal: controller.signal })
        .then(async (res) => {
          if (!res.ok) {
            const body = (await res.json().catch(() => ({}))) as {
              error?: string;
            };
            throw new Error(body.error ?? `Search failed (${res.status})`);
          }
          return res.json() as Promise<ItemSearchApiResponse>;
        })
        .then((data) => {
          setResults(data.results);
          setHighlightIndex(0);
        })
        .catch((err: unknown) => {
          if (controller.signal.aborted) return;
          setResults([]);
          setSearchError(
            err instanceof Error ? err.message : "Search failed",
          );
        })
        .finally(() => {
          if (!controller.signal.aborted) setIsSearching(false);
        });
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, []);

  const onKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
      setIsOpen(true);
      return;
    }

    if (!showDropdown && results.length === 0) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setHighlightIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setHighlightIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === "Enter" && results[highlightIndex]) {
      event.preventDefault();
      selectItem(results[highlightIndex]);
    } else if (event.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div ref={rootRef} className={`relative ${className ?? ""}`}>
      <label htmlFor={`${listboxId}-input`} className="sr-only">
        Search goal item
      </label>
      <input
        ref={inputRef}
        id={`${listboxId}-input`}
        type="search"
        role="combobox"
        aria-expanded={isOpen}
        aria-controls={listboxId}
        aria-autocomplete="list"
        autoComplete="off"
        placeholder="Search goal item (e.g. Hyperion)"
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setSelectedLabel(null);
          setIsOpen(true);
        }}
        onFocus={() => setIsOpen(true)}
        onKeyDown={onKeyDown}
        className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 focus:border-amber-500/70 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
      />

      {targetInternalId && selectedLabel ? (
        <p className="mt-1 font-mono text-[10px] text-zinc-500">
          Target: {targetInternalId}
          {isGraphLoading ? " · loading tree…" : ""}
        </p>
      ) : null}

      {isOpen && query.trim().length >= MIN_QUERY_LENGTH ? (
        <ul
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-zinc-700 bg-zinc-900 py-1 shadow-xl"
        >
          {isSearching ? (
            <li className="px-3 py-2 text-sm text-zinc-500">Searching…</li>
          ) : null}
          {searchError ? (
            <li className="px-3 py-2 text-sm text-red-400">{searchError}</li>
          ) : null}
          {!isSearching && !searchError && results.length === 0 ? (
            <li className="px-3 py-2 text-sm text-zinc-500">No items found</li>
          ) : null}
          {showDropdown
            ? results.map((item, index) => (
                <li key={item.internalId} role="option" aria-selected={index === highlightIndex}>
                  <button
                    type="button"
                    className={[
                      "flex w-full flex-col gap-0.5 px-3 py-2 text-left text-sm transition-colors",
                      index === highlightIndex
                        ? "bg-amber-500/15 text-zinc-100"
                        : "text-zinc-300 hover:bg-zinc-800",
                    ].join(" ")}
                    onMouseEnter={() => setHighlightIndex(index)}
                    onClick={() => selectItem(item)}
                  >
                    <span className="font-medium">{item.displayName}</span>
                    <span className="flex items-center gap-2 font-mono text-[10px] text-zinc-500">
                      {item.internalId}
                      {item.tier ? (
                        <span className={tierBadgeClass(item.tier)}>
                          {item.tier}
                        </span>
                      ) : null}
                    </span>
                  </button>
                </li>
              ))
            : null}
        </ul>
      ) : null}
    </div>
  );
}
