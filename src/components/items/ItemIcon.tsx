"use client";

import { useState } from "react";
import { tierBorderClass } from "@/lib/items/tier-styles";

export interface ItemIconProps {
  internalId: string;
  displayName: string;
  tier?: string | null;
  iconUrl?: string | null;
  size?: number;
  className?: string;
}

export function ItemIcon({
  internalId,
  displayName,
  tier = null,
  iconUrl = null,
  size = 32,
  className = "",
}: ItemIconProps) {
  const [imgFailed, setImgFailed] = useState(false);
  const letter = displayName.trim().charAt(0).toUpperCase() || "?";

  return (
    <div
      className={[
        "relative shrink-0 overflow-hidden rounded border bg-zinc-900/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]",
        tierBorderClass(tier),
        className,
      ].join(" ")}
      style={{ width: size, height: size }}
      title={displayName}
    >
      {iconUrl && !imgFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={iconUrl}
          alt=""
          width={size}
          height={size}
          className="h-full w-full object-contain p-0.5"
          loading="lazy"
          onError={() => setImgFailed(true)}
        />
      ) : (
        <span
          className="flex h-full w-full items-center justify-center text-xs font-bold text-zinc-400"
          aria-hidden
        >
          {letter}
        </span>
      )}
      <span className="sr-only">{displayName}</span>
    </div>
  );
}
