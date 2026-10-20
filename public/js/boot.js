// Runs first, in <head>: marks JavaScript as available, sets Google Consent
// Mode v2 defaults to denied, and configures the Google tag (gtag.js), which
// loads right after this file.
document.documentElement.classList.replace('no-js', 'js');
window.dataLayer = window.dataLayer || [];
window.gtag = function () { window.dataLayer.push(arguments); };
window.gtag('consent', 'default', {
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  analytics_storage: 'denied',
  functionality_storage: 'denied',
  personalization_storage: 'denied',
  security_storage: 'granted',
  wait_for_update: 500,
});
// A visitor who already accepted analytics keeps it from the first hit.
try {
  var saved = JSON.parse(localStorage.getItem('mexisol-consent-v1') || 'null');
  if (saved && saved.analytics) window.gtag('consent', 'update', { analytics_storage: 'granted' });
} catch (e) { /* storage blocked */ }
var gaId = document.currentScript && document.currentScript.getAttribute('data-ga');
if (gaId) {
  window.gtag('js', new Date());
  window.gtag('config', gaId);
}
