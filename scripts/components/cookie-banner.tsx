export function CookieBanner({ gaId }: { gaId: string }) {
  if (!gaId) return null;
  return (
    <div id="cookie-consent" className="cookie-consent" hidden>
      <p className="cookie-consent-text">
        このサイトでは Google Analytics を使ってアクセス状況を計測しています。許可いただける場合は「同意する」を押してください。
      </p>
      <div className="cookie-consent-actions">
        <button type="button" data-consent="denied">拒否する</button>
        <button type="button" data-consent="granted">同意する</button>
      </div>
    </div>
  );
}
