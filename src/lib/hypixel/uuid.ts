export function stripUuidDashes(uuid: string): string {
  return uuid.replace(/-/g, "");
}

export function addUuidDashes(uuid: string): string {
  const clean = stripUuidDashes(uuid);
  if (clean.length !== 32) return uuid;
  return `${clean.slice(0, 8)}-${clean.slice(8, 12)}-${clean.slice(12, 16)}-${clean.slice(16, 20)}-${clean.slice(20)}`;
}
