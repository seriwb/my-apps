export const PLATFORM_LABEL: Record<string, string> = {
  mac: "macOS",
  win: "Windows",
  linux: "Linux",
};

export function PlatformBadges({ platforms }: { platforms: string[] }) {
  return (
    <>
      {platforms.map((p) => (
        <span key={p} className={`badge badge-${p}`}>{PLATFORM_LABEL[p] ?? p}</span>
      ))}
    </>
  );
}
