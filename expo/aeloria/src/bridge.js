// JavaScript injected into the game before it loads. It gives the game the three hooks it already
// understands (see www/ads.js and www/live.js):
//   window.AeloriaAdsNative.call(msg) → Promise<boolean>   ads (init / show / place / privacy)
//   window.AELORIA_PAYMENTS.buy(id) / .restore()           App Store purchases
//   window.AeloriaNative.openSettings()                     native Privacy & Settings screen
export function bridgeScript({ payments }) {
  return `(function () {
  var seq = 0, wait = {};
  window.__rnReply = function (id, value) { var f = wait[id]; if (f) { delete wait[id]; f(value); } };
  function send(kind, payload, timeoutMs) {
    return new Promise(function (resolve) {
      var id = ++seq; wait[id] = resolve;
      window.ReactNativeWebView.postMessage(JSON.stringify({ kind: kind, id: id, payload: payload || {} }));
      if (timeoutMs) setTimeout(function () { if (wait[id]) { delete wait[id]; resolve(null); } }, timeoutMs);
    });
  }
  window.AeloriaAdsNative = { call: function (msg) {
    return send('ads', msg, msg && msg.cmd === 'show' ? 120000 : 15000).then(function (r) { return !!r; });
  } };
  ${payments ? `window.AELORIA_PAYMENTS = {
    buy: function (id) { return send('buy', { product: id }).then(function (r) { if (r && r.ok) return true; throw new Error((r && r.error) || 'Purchase failed'); }); },
    restore: function () { return send('restore', {}).then(function (r) { if (r && r.ok) return r.owned || []; throw new Error('Restore failed'); }); }
  };` : ''}
  window.AeloriaNative = { platform: 'ios', openSettings: function () { send('settings', {}); } };
  true;
})();`;
}
