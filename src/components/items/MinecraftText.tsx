"use client";

import type { CSSProperties } from "react";
import type { MinecraftTextSegment } from "@/lib/minecraft/color-codes";
import { parseMinecraftFormattedText } from "@/lib/minecraft/color-codes";

export interface MinecraftTextProps {
  text: string;
  className?: string;
}

function segmentStyle(style: MinecraftTextSegment["style"]): CSSProperties {
  return {
    color: style.color,
    fontWeight: style.bold ? 700 : undefined,
    fontStyle: style.italic ? "italic" : undefined,
    textDecoration: [
      style.underline ? "underline" : "",
      style.strikethrough ? "line-through" : "",
    ]
      .filter(Boolean)
      .join(" ") || undefined,
  };
}

export function MinecraftText({ text, className }: MinecraftTextProps) {
  const segments = parseMinecraftFormattedText(text);

  return (
    <span className={className}>
      {segments.map((segment, index) => (
        <span key={index} style={segmentStyle(segment.style)}>
          {segment.text}
        </span>
      ))}
    </span>
  );
}
