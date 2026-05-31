export function tierBadgeClass(tier: string | null): string {
  switch (tier) {
    case "LEGENDARY":
      return "text-amber-400";
    case "EPIC":
      return "text-violet-400";
    case "RARE":
      return "text-sky-400";
    case "UNCOMMON":
      return "text-emerald-400";
    case "MYTHIC":
      return "text-fuchsia-400";
    case "DIVINE":
      return "text-cyan-300";
    default:
      return "text-zinc-500";
  }
}

export function tierBorderClass(tier: string | null): string {
  switch (tier) {
    case "LEGENDARY":
      return "border-amber-500/40";
    case "EPIC":
      return "border-violet-500/40";
    case "RARE":
      return "border-sky-500/40";
    case "UNCOMMON":
      return "border-emerald-500/40";
    case "MYTHIC":
      return "border-fuchsia-500/40";
    case "DIVINE":
      return "border-cyan-400/40";
    default:
      return "border-zinc-700";
  }
}
