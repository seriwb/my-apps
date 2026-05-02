const CONSENT_INIT = `window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('consent', 'default', { analytics_storage: 'denied', ad_storage: 'denied' });
  (function () {
    if (localStorage.getItem('ga_consent') === 'granted') {
      gtag('consent', 'update', { analytics_storage: 'granted' });
    }
  })();`;

const COOKIE_CONSENT_HANDLER = `(function () {
    var CONSENT_KEY = 'ga_consent';
    function showBanner() {
      var el = document.getElementById('cookie-consent');
      if (el) el.hidden = false;
    }
    function hideBanner() {
      var el = document.getElementById('cookie-consent');
      if (el) el.hidden = true;
    }
    if (!localStorage.getItem(CONSENT_KEY)) {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showBanner);
      } else {
        showBanner();
      }
    }
    document.addEventListener('click', function (e) {
      var btn = e.target.closest && e.target.closest('[data-consent]');
      if (btn) {
        var choice = btn.getAttribute('data-consent');
        localStorage.setItem(CONSENT_KEY, choice);
        if (typeof gtag !== 'undefined') {
          gtag('consent', 'update', {
            analytics_storage: choice === 'granted' ? 'granted' : 'denied',
          });
        }
        hideBanner();
        return;
      }
      var reset = e.target.closest && e.target.closest('[data-consent-reset]');
      if (reset) {
        e.preventDefault();
        localStorage.removeItem(CONSENT_KEY);
        showBanner();
      }
    });
  })();`;

export function GaSnippet({ id }: { id: string }) {
  if (!id) return null;
  const configScript = `gtag('js', new Date());
  gtag('config', '${id}');
  document.addEventListener('click', function (e) {
    var dl = e.target.closest && e.target.closest('[data-ga-event="download"]');
    if (dl) {
      gtag('event', 'download', {
        app_id: dl.dataset.gaAppId,
        app_version: dl.dataset.gaAppVersion,
        platform: dl.dataset.gaPlatform,
      });
    }
  });`;
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: CONSENT_INIT }} />
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${id}`} />
      <script dangerouslySetInnerHTML={{ __html: configScript }} />
      <script dangerouslySetInnerHTML={{ __html: COOKIE_CONSENT_HANDLER }} />
    </>
  );
}
