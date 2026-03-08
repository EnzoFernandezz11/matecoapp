export function getFallbackAvatar(name: string): string {
  const encoded = encodeURIComponent(name.trim() || "Mateco");
  return `https://ui-avatars.com/api/?name=${encoded}&background=253c0b&color=ffffff`;
}
