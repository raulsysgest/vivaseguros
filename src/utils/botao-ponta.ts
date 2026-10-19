import { cn } from "@/utils/cn";

/** TL + BR arredondados; TR + BL com ponta (referência legado / mock). */
export const raioBotaoPonta =
  "rounded-tl-[1.75rem] rounded-tr-[0.25rem] rounded-br-[1.75rem] rounded-bl-[0.25rem]";

export function classesBotaoSimuleJa(className?: string) {
  return cn(
    raioBotaoPonta,
    "bg-gradient-to-r from-[#C026D3] via-[#DB2777] to-[#EA580C] text-white text-xs sm:text-sm font-black uppercase tracking-widest shadow-xl shadow-fuchsia-900/25 transition-all duration-200 ease-in-out hover:brightness-110 active:scale-95 cursor-pointer",
    className,
  );
}

export function classesBotaoSeguinte(enabled: boolean, className?: string) {
  return cn(
    raioBotaoPonta,
    "border-2 border-white text-white font-black uppercase tracking-wider shadow-lg transition-all duration-300",
    enabled
      ? "bg-[#C85A27] hover:bg-[#B34E20] hover:brightness-105 active:scale-95 cursor-pointer"
      : "bg-[#C85A27]/50 opacity-50 cursor-not-allowed border-white/70",
    className,
  );
}

export function classesBotaoAcaoModal(className?: string, enabled = true) {
  return cn(
    raioBotaoPonta,
    "px-5 py-3 text-[11px] font-bold uppercase tracking-wide text-white sm:text-xs transition-colors",
    enabled
      ? "cursor-pointer bg-[#212546] hover:bg-[#2d325c]"
      : "cursor-not-allowed bg-[#212546]/50 opacity-60",
    className,
  );
}
