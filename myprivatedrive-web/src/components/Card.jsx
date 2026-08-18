import { T } from "../styleTokens";

export default function Card({ icon, title, description, children, className = "" }) {
  return (
    <section className={T.card + " " + className}>
      <div className={T.cardHeader}>
        <div className={T.cardIcon}>{icon}</div>
        <div className="min-w-0">
          <div className={T.cardTitle}>{title}</div>
          {description && <div className={T.cardDesc}>{description}</div>}
        </div>
      </div>
      <div className={T.cardBody}>{children}</div>
    </section>
  );
}
