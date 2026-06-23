import type { ResolvedApp } from "../types";
import { PlatformBadges } from "./platform-badges";

export function Card({ app }: { app: ResolvedApp }) {
  const { def, version } = app;
  return (
    <a className="card" href={`apps/${def.id}.html`}>
      <div className="card-icon-wrap">
        <img className="card-icon" src={def.icon} alt={`${def.name} icon`} width={64} height={64} />
      </div>
      <div className="card-body">
        <div className="card-body-top">
          <h2 className="card-title">{def.name}</h2>
          <p className="card-tagline">{def.tagline}</p>
          <div className="card-platforms">
            <PlatformBadges platforms={def.platforms} />
          </div>
        </div>
        <div className="card-footer">
          <span className="card-version">{version}</span>
          <span className="card-cta">
            入手 <span className="card-cta-arrow">»</span>
          </span>
        </div>
      </div>
    </a>
  );
}
