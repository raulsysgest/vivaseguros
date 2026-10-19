/** Rotas acessíveis sem sessão (deny-by-default fora desta lista). */
export function isPublicPath(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname.startsWith("/api/auth")) return true;
  if (pathname.startsWith("/_next")) return true;
  if (pathname === "/favicon.ico") return true;
  if (/\.(png|jpe?g|gif|webp|svg|ico|woff2?)$/i.test(pathname)) return true;
  if (pathname.startsWith("/banners/")) return true;
  if (pathname.startsWith("/icones/")) return true;
  return false;
}
