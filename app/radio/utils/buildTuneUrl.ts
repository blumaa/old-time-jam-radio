export function buildTuneUrl(r2PublicUrl: string, tune: { url: string }): string {
  return `${r2PublicUrl}/${tune.url.split("/").map(encodeURIComponent).join("/")}`;
}
