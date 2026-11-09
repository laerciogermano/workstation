import type { Clock } from './clock.js';
import type { Db } from './db.js';
import type { Env } from './env.js';
import type { Logger } from './logger.js';
import type { Mailer } from './mail/mailer.js';
import type { TokenService } from '../modules/identity/tokens.js';
import type { SefazPort } from '../modules/receipts/sefaz.port.js';
import type { ProductLookupPort } from '../modules/barcodes/product-lookup.port.js';
import type { EanSuggestPort } from '../modules/barcodes/ean-suggest.port.js';
import type { PriceIndex } from '../modules/catalog/price-index.js';

/** Composição explícita (sem container mágico): main.ts monta, testes trocam adaptadores. */
export interface Deps {
  env: Env;
  db: Db;
  log: Logger;
  clock: Clock;
  tokens: TokenService;
  mailer: Mailer;
  sefaz: SefazPort;
  productLookup: ProductLookupPort;
  eanSuggest: EanSuggestPort;
  index: PriceIndex;
}
