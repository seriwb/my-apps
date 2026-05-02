import type { ResolvedApp } from "../types";
import { PlatformBadges } from "./platform-badges";

export function Card({ app }: { app: ResolvedApp }) {
  const { def, version } = app;
  return (
    <article className="card">
      <div className="card-header">
        <img className="card-icon" src={def.icon} alt={`${def.name} icon`} width={48} height={48} />
        <div>
          <h2 className="card-title">{def.name}</h2>
          <p className="card-tagline">{def.tagline}</p>
        </div>
      </div>
      <div className="card-platforms">
        <PlatformBadges platforms={def.platforms} />
      </div>
      <div className="card-footer">
        <span className="card-version">{version}</span>
        <a className="btn-secondary" href={`apps/${def.id}.html`}>詳細を見る →</a>
      </div>
    </article>
  );
}
