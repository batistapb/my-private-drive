import { T } from "../styleTokens";

export default function PageHeader({ breadcrumb, title, subtitle }) {
  return (
    <div className="mb-7">
      {breadcrumb && <div className={"mb-1.5 text-xs " + T.textTertiary}>{breadcrumb}</div>}
      <h1 className="text-[26px] font-bold tracking-tight">{title}</h1>
      {subtitle && <p className={"mt-1.5 text-sm " + T.textSecondary}>{subtitle}</p>}
    </div>
  );
}
