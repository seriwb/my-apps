import type { ResolvedApp } from "../types";
import { PLATFORM_LABEL } from "./platform-badges";

export function DownloadButtons({ app }: { app: ResolvedApp }) {
  const { def, version, downloadUrls } = app;
  return (
    <>
      {def.platforms.map((p) => {
        const url = downloadUrls[p];
        const label = PLATFORM_LABEL[p] ?? p;
        const suffix = p === "mac" ? " (arm64)" : p === "win" ? " (64bit)" : "";
        if (url) {
          return (
            <a
              key={p}
              className="btn-primary"
              href={url}
              download
              data-ga-event="download"
              data-ga-app-id={def.id}
              data-ga-app-version={version}
              data-ga-platform={p}
            >
              {label}{suffix} <span style={{ fontSize: "12px", opacity: 0.8 }}>v{version}</span>
            </a>
          );
        }
        return (
          <span key={p} className="btn-primary disabled">{label} — 未リリース</span>
        );
      })}
    </>
  );
}
