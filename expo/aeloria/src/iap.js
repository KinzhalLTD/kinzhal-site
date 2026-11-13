// App Store purchases (StoreKit through react-native-iap). Game product IDs map to
// App Store product IDs as `space.kinzhal.aeloria.<id>`.
import { IAP_CONSUMABLE, IAP_NON_CONSUMABLE, IAP_PREFIX } from './appConfig';

let IAP = null;
try { IAP = require('react-native-iap'); } catch (e) { IAP = null; }   // missing in Expo Go
export const iapAvailable = !!IAP;

const ALL = [...IAP_CONSUMABLE, ...IAP_NON_CONSUMABLE];
const gameId = sku => (sku || '').startsWith(IAP_PREFIX) ? sku.slice(IAP_PREFIX.length) : null;

export class Store {
  constructor({ grant }) { this.grant = grant; this.pending = {}; this.prices = {}; this.ok = false; this.subs = []; }

  async init() {
    if (!IAP) return false;
    try { await IAP.initConnection(); } catch (e) { return false; }
    this.ok = true;
    // Also receives purchases that finished while the app was closed (Ask to Buy, interruptions).
    this.subs.push(IAP.purchaseUpdatedListener(p => this.onPurchase(p)));
    this.subs.push(IAP.purchaseErrorListener(e => this.onError(e)));
    try {
      const products = await IAP.getProducts({ skus: ALL.map(id => IAP_PREFIX + id) });
      for (const p of products) { const id = gameId(p.productId); if (id) this.prices[id] = p.localizedPrice; }
    } catch (e) { }
    return true;
  }

  end() { this.subs.forEach(s => { try { s.remove(); } catch (e) { } }); try { IAP && IAP.endConnection(); } catch (e) { } }

  buy(id) {
    if (!this.ok || !ALL.includes(id)) return Promise.resolve({ ok: false, error: 'This item is not available right now' });
    const sku = IAP_PREFIX + id;
    return new Promise(resolve => {
      this.pending[sku] = resolve;
      IAP.requestPurchase({ sku, andDangerouslyFinishTransactionAutomaticallyIOS: false })
        .catch(e => this.settle(sku, { ok: false, error: e && e.code === 'E_USER_CANCELLED' ? 'cancelled' : (e && e.message) || 'Purchase failed' }));
    });
  }

  settle(sku, result) { const r = this.pending[sku]; if (r) { delete this.pending[sku]; r(result); } }

  async onPurchase(purchase) {
    const id = gameId(purchase.productId); if (!id) return;
    const isConsumable = IAP_CONSUMABLE.includes(id);
    if (this.pending[purchase.productId]) this.settle(purchase.productId, { ok: true });   // the game grants the items
    else if (!(await this.grant(id))) return;   // game not ready: keep the transaction for next launch
    try { await IAP.finishTransaction({ purchase, isConsumable }); } catch (e) { }
  }

  onError(e) {
    const error = e && e.code === 'E_USER_CANCELLED' ? 'cancelled' : (e && e.message) || 'Purchase failed';
    Object.keys(this.pending).forEach(sku => this.settle(sku, { ok: false, error }));
  }

  async restore() {
    if (!this.ok) return { ok: false };
    try {
      const list = await IAP.getAvailablePurchases();
      const owned = [...new Set(list.map(p => gameId(p.productId)).filter(id => id && IAP_NON_CONSUMABLE.includes(id)))];
      return { ok: true, owned };
    } catch (e) { return { ok: false }; }
  }
}
