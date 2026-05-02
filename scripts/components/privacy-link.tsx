export function PrivacyLink({ root, gaId }: { root: string; gaId: string }) {
  if (!gaId) return null;
  return <> · <a href={`${root}privacy.html`}>プライバシー設定</a></>;
}
