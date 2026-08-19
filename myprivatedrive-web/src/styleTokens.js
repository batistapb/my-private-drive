// Design tokens ported from the mydriveredesign.html mockup (bg #0b0d12 / accent #5b8cff
// palette, rounded 10-16px surfaces, card-based sections with icon headers).
export const T = {
  pageBg: "bg-[#f4f5f7] dark:bg-[#0b0d12] text-[#1a1d24] dark:text-[#f1f3f6]",
  surface: "bg-white dark:bg-[#12151c]",
  surfaceHover: "hover:bg-[#f4f5f7] dark:hover:bg-[#171b24]",
  border: "border-[#e4e6eb] dark:border-[#232833]",
  borderSoft: "border-[#ebedf1] dark:border-[#1c212b]",
  textPrimary: "text-[#1a1d24] dark:text-[#f1f3f6]",
  textSecondary: "text-[#5b6270] dark:text-[#9aa3b2]",
  textTertiary: "text-[#8a91a0] dark:text-[#666f80]",
  accentText: "text-[#3b6fef] dark:text-[#5b8cff]",
  accentBg: "bg-[#3b6fef] dark:bg-[#5b8cff]",
  accentBgHover: "hover:bg-[#2f5fdb] dark:hover:bg-[#6f9aff]",
  accentSoftBg: "bg-[#3b6fef]/8 dark:bg-[#5b8cff]/12",
  accentSoftBorder: "border-[#3b6fef]/22 dark:border-[#5b8cff]/28",
  dangerText: "text-[#e0435a] dark:text-[#ff6b6b]",
  dangerBg: "bg-[#e0435a] dark:bg-[#ff6b6b]",
  dangerSoftBg: "bg-[#e0435a]/8 dark:bg-[#ff6b6b]/10",
  successText: "text-[#16a34a] dark:text-[#4ade80]",
  successSoftBg: "bg-[#16a34a]/10 dark:bg-[#4ade80]/12",

  input:
    "w-full rounded-lg border border-[#e4e6eb] dark:border-[#232833] bg-[#f4f5f7] dark:bg-[#171b24] px-3 py-2 text-sm text-[#1a1d24] dark:text-[#f1f3f6] placeholder-[#8a91a0] dark:placeholder-[#666f80] outline-none transition-colors focus:border-[#3b6fef]/40 dark:focus:border-[#5b8cff]/40 focus:ring-2 focus:ring-[#3b6fef]/8 dark:focus:ring-[#5b8cff]/12",

  btnPrimary:
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-[#3b6fef] dark:bg-[#5b8cff] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#2f5fdb] dark:hover:bg-[#6f9aff]",
  btnGhost:
    "inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#e4e6eb] dark:border-[#232833] bg-transparent px-4 py-2 text-sm font-semibold text-[#5b6270] dark:text-[#9aa3b2] transition-colors hover:bg-[#f4f5f7] dark:hover:bg-[#171b24] hover:text-[#1a1d24] dark:hover:text-[#f1f3f6]",
  btnDangerSm:
    "inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-[#e0435a] dark:bg-[#ff6b6b] px-2.5 py-1.5 text-xs font-semibold text-white transition-opacity hover:opacity-90",
  btnPrimarySm:
    "inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-[#3b6fef] dark:bg-[#5b8cff] px-2.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#2f5fdb] dark:hover:bg-[#6f9aff]",
  btnGhostSm:
    "inline-flex items-center gap-1 whitespace-nowrap rounded-lg bg-[#5b6270] dark:bg-[#9aa3b2]/20 px-2.5 py-1.5 text-xs font-semibold text-white dark:text-[#f1f3f6] transition-opacity hover:opacity-90",

  card: "mb-5 overflow-hidden rounded-2xl border border-[#ebedf1] dark:border-[#1c212b] bg-white dark:bg-[#12151c] shadow-sm",
  cardHeader: "flex items-center gap-3 border-b border-[#ebedf1] dark:border-[#1c212b] px-5 py-4",
  cardIcon:
    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3b6fef]/8 dark:bg-[#5b8cff]/12 text-[#3b6fef] dark:text-[#5b8cff]",
  cardTitle: "text-[15px] font-semibold tracking-tight text-[#1a1d24] dark:text-[#f1f3f6]",
  cardDesc: "mt-0.5 text-xs text-[#8a91a0] dark:text-[#666f80]",
  cardBody: "px-5 py-4",

  navItem:
    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium text-[#5b6270] dark:text-[#9aa3b2] transition-colors hover:bg-[#f4f5f7] dark:hover:bg-[#171b24] hover:text-[#1a1d24] dark:hover:text-[#f1f3f6]",
  navItemActive:
    "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-semibold bg-[#3b6fef]/8 dark:bg-[#5b8cff]/12 text-[#3b6fef] dark:text-[#5b8cff]",

  linkHover: "transition-colors hover:text-[#3b6fef] dark:hover:text-[#5b8cff]",

  avatarGradientPink: "bg-gradient-to-br from-[#f472b6] to-[#a855f7]",
  avatarGradientBlue: "bg-gradient-to-br from-[#34d399] to-[#22a3e0]",
};
