/** Minecraft legacy formatting codes (§0–§f, §k–§r). */

export interface MinecraftColorStyle {
  color?: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  obfuscated?: boolean;
}

export const MINECRAFT_COLORS: Record<string, string> = {
  "0": "#000000",
  "1": "#0000AA",
  "2": "#00AA00",
  "3": "#00AAAA",
  "4": "#AA0000",
  "5": "#AA00AA",
  "6": "#FFAA00",
  "7": "#AAAAAA",
  "8": "#555555",
  "9": "#5555FF",
  a: "#55FF55",
  b: "#55FFFF",
  c: "#FF5555",
  d: "#FF55FF",
  e: "#FFFF55",
  f: "#FFFFFF",
};

export interface MinecraftTextSegment {
  text: string;
  style: MinecraftColorStyle;
}

const DEFAULT_STYLE: MinecraftColorStyle = { color: "#FFFFFF" };

/**
 * Split a Minecraft-formatted string into styled segments.
 * Supports § and \u00a7 code points.
 */
export function parseMinecraftFormattedText(input: string): MinecraftTextSegment[] {
  const segments: MinecraftTextSegment[] = [];
  let style: MinecraftColorStyle = { ...DEFAULT_STYLE };
  const parts = input.split(/(?:§|\u00a7)(?=[0-9a-fk-or])/i);

  for (const part of parts) {
    if (!part) continue;

    const code = part[0]?.toLowerCase();
    const rest = part.slice(1);

    if (code && /^[0-9a-fk-or]$/.test(code)) {
      if (code in MINECRAFT_COLORS) {
        style = { color: MINECRAFT_COLORS[code] };
      } else if (code === "k") {
        style = { ...style, obfuscated: true };
      } else if (code === "l") {
        style = { ...style, bold: true };
      } else if (code === "m") {
        style = { ...style, strikethrough: true };
      } else if (code === "n") {
        style = { ...style, underline: true };
      } else if (code === "o") {
        style = { ...style, italic: true };
      } else if (code === "r") {
        style = { ...DEFAULT_STYLE };
      }

      if (rest) {
        segments.push({ text: rest, style: { ...style } });
      }
      continue;
    }

    segments.push({ text: part, style: { ...style } });
  }

  return segments.filter((s) => s.text.length > 0);
}

export function stripMinecraftColorCodes(input: string): string {
  return input.replace(/(?:§|\u00a7)[0-9a-fk-or]/gi, "");
}
