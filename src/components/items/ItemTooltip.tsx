"use client";

import type { ReactNode } from "react";
import { useCallback, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ItemIcon } from "@/components/items/ItemIcon";
import { MinecraftText } from "@/components/items/MinecraftText";
import { tierBadgeClass } from "@/lib/items/tier-styles";

export interface ItemTooltipData {
  internalId: string;
  displayName: string;
  tier?: string | null;
  coloredName?: string | null;
  loreLines?: string[];
  iconUrl?: string | null;
}

export interface ItemTooltipProps {
  item: ItemTooltipData;
  children: ReactNode;
  iconSize?: number;
  showIcon?: boolean;
}

/**
 * Wiki-style hover tooltip modeled after Fandom's minetip.js + in-game lore:
 * dark panel, colored name, lore lines with § codes, tier footer.
 */
export function ItemTooltip({
  item,
  children,
  iconSize = 32,
  showIcon = true,
}: ItemTooltipProps) {
  const tooltipId = useId();
  const anchorRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });

  const updatePosition = useCallback(() => {
    const el = anchorRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const tooltipWidth = 280;
    let left = rect.left;
    let top = rect.bottom + 8;

    if (left + tooltipWidth > window.innerWidth - 8) {
      left = window.innerWidth - tooltipWidth - 8;
    }
    if (top + 200 > window.innerHeight - 8) {
      top = rect.top - 8;
    }

    setPosition({ top, left });
  }, []);

  const loreLines = item.loreLines ?? [];
  const headerText = item.coloredName ?? item.displayName;

  const tooltip =
    visible && typeof document !== "undefined"
      ? createPortal(
          <div
            id={tooltipId}
            role="tooltip"
            className="sc-minecraft-tooltip pointer-events-none fixed z-[100] w-[280px] rounded px-2.5 py-2 shadow-2xl shadow-black/60"
            style={{ top: position.top, left: position.left }}
          >
            <div className="flex gap-2">
              {showIcon ? (
                <ItemIcon
                  internalId={item.internalId}
                  displayName={item.displayName}
                  tier={item.tier}
                  iconUrl={item.iconUrl}
                  size={iconSize}
                />
              ) : null}
              <div className="min-w-0 flex-1">
                <p className="text-sm leading-snug">
                  <MinecraftText text={headerText} />
                </p>
                {loreLines.length > 0 ? (
                  <ul className="mt-1.5 space-y-0.5 border-t border-white/10 pt-1.5">
                    {loreLines.slice(0, 12).map((line, index) => (
                      <li
                        key={`${index}-${line.slice(0, 12)}`}
                        className="text-[11px] leading-snug text-white/80"
                      >
                        <MinecraftText text={line} />
                      </li>
                    ))}
                  </ul>
                ) : null}
                {item.tier ? (
                  <p
                    className={`mt-1.5 border-t border-white/10 pt-1 text-[10px] uppercase tracking-wide ${tierBadgeClass(item.tier)}`}
                  >
                    {item.tier}
                  </p>
                ) : null}
              </div>
            </div>
          </div>,
          document.body,
        )
      : null;

  return (
    <>
      <div
        ref={anchorRef}
        className="inline-flex"
        onMouseEnter={() => {
          updatePosition();
          setVisible(true);
        }}
        onMouseLeave={() => setVisible(false)}
        onFocus={() => {
          updatePosition();
          setVisible(true);
        }}
        onBlur={() => setVisible(false)}
        aria-describedby={visible ? tooltipId : undefined}
      >
        {children}
      </div>
      {tooltip}
    </>
  );
}
