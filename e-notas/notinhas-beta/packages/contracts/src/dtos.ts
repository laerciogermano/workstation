/** DTOs de resposta (camelCase, datas ISO 8601 UTC, dinheiro em centavos — a UI formata). */
import type { BarcodeOrigin } from './inputs.js';

export type ISODate = string;

export interface UserDTO {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  storeOptIn: boolean;
}

export interface MeDTO {
  visitorId: string;
  /** IP público como o servidor o vê (REQ-050) — exibido ao titular no Perfil */
  ip: string | null;
  user: UserDTO | null;
  points: number;
  credits: number;
  /** contribuições feitas sem conta, que entram no merge ao criar conta */
  pending: { receipts: number; lists: number; points: number };
}

export interface SessionDTO {
  accessToken: string;
  expiresIn: number;
  me: MeDTO;
}

export interface StoreRefDTO {
  id: number;
  name: string;
  neighborhood: string | null;
}

export interface OfferDTO {
  store: StoreRefDTO;
  priceCents: number;
  observedAt: ISODate;
  distanceKm: number | null;
  isStale: boolean;
}

export interface ProductCardDTO {
  gtin: string;
  title: string;
  brand: string | null;
  category: string;
  photoUrl: string | null;
  best: OfferDTO | null;
  highlight: { medianCents: number; ratio: number } | null;
}

export interface HomeDTO {
  promotions: ProductCardDTO[];
  mostBought: ProductCardDTO[];
  categories: { id: string; name: string; products: ProductCardDTO[] }[];
  stats: { stores: number; receipts: number; products: number };
}

export interface UnlinkedItemDTO {
  store: StoreRefDTO;
  storeCode: string;
  description: string;
  displayName: string;
  priceCents: number;
  observedAt: ISODate;
}

export interface SearchDTO {
  q: string;
  gtinQuery: { gtin: string; valid: boolean } | null;
  products: ProductCardDTO[];
  /** itens sem EAN que casam pela descrição — confiança menor (Q6) */
  unlinked: UnlinkedItemDTO[];
}

export interface ComparisonRowDTO extends OfferDTO {
  lat: number | null;
  lng: number | null;
  isBest: boolean;
}

/** Contagem de votos de EAN num (loja, cód. interno). */
export interface BarcodeRegistrationTallyDTO {
  gtin: string;
  votes: number;
  /** true = gtin ativo em barcode_links (mais votado). */
  primary: boolean;
}

/** Contagem de votos de foto por EAN (espelho de barcode_registrations). */
export interface PhotoRegistrationTallyDTO {
  url: string;
  votes: number;
  /** true = URL ativa em products.photo_url (mais votada). */
  primary: boolean;
}

export type SetProductPhotoStatus = 'set' | 'registered' | 'primary_changed';

export interface SetProductPhotoResultDTO {
  ok: true;
  status: SetProductPhotoStatus;
  primaryUrl: string;
  registrations: PhotoRegistrationTallyDTO[];
}

export interface ProductPhotosDTO {
  current: string | null;
  candidates: { url: string; source: string; votes: number; primary: boolean }[];
  registrations: PhotoRegistrationTallyDTO[];
}

/** Vínculo (loja, cód. interno) → este EAN — base do “Alterar código” na ficha (REQ-067). */
export interface ProductBarcodeLinkDTO {
  storeId: number;
  storeCode: string;
  storeName: string;
  description: string;
  displayName: string;
  origin: BarcodeOrigin | null;
  /** Votos deste EAN neste cód. interno. */
  votes: number;
  /** Todos os EAN registrados neste cód. (mais votado = primary). */
  registrations: BarcodeRegistrationTallyDTO[];
}

export interface ProductDetailDTO {
  product: {
    gtin: string;
    title: string;
    brand: string | null;
    category: string;
    subcategory: string | null;
    ncm: string | null;
    photoUrl: string | null;
    sources: string[];
  };
  best: OfferDTO | null;
  medianCents: number | null;
  highlight: { medianCents: number; ratio: number } | null;
  comparison: ComparisonRowDTO[];
  /** todas as observações (NFC-e) — histórico e “últimos registros” */
  history: OfferDTO[];
  /** vínculos barcode_links deste EAN (para reescanear / Alterar) */
  links: ProductBarcodeLinkDTO[];
}

export interface ReceiptItemDTO {
  id: number;
  lineNo: number;
  storeCode: string;
  description: string;
  displayName: string;
  quantity: number;
  unit: string | null;
  unitCents: number;
  totalCents: number;
  gtin: string | null;
  origin: BarcodeOrigin | null;
  photoUrl: string | null;
}

export interface ReceiptDTO {
  id: string;
  accessKey: string;
  number: string | null;
  series: string | null;
  issuedAt: ISODate | null;
  totalCents: number | null;
  store: StoreRefDTO & { address: string | null };
  items: ReceiptItemDTO[];
  eanProgress: { done: number; total: number };
}

export interface ReceiptSummaryDTO {
  id: string;
  store: StoreRefDTO;
  number: string | null;
  issuedAt: ISODate | null;
  totalCents: number | null;
  itemCount: number;
  withEan: number;
}

export type IngestStatus = 'created' | 'duplicate';
export interface IngestResultDTO {
  status: IngestStatus;
  pointsAwarded: number;
  receipt: ReceiptDTO;
}

export interface SuggestionDTO {
  gtin: string;
  title: string;
  photoUrl: string | null;
  score: number;
  /** `catalogo` = pg_trgm local · `si5` = ean-serp (REQ-044) */
  source: 'catalogo' | 'openfoodfacts' | 'si5';
}

/** linked = 1º vínculo do cód. · registered = novo voto (principal igual) · primary_changed = novo principal · replaced/flagged = legado */
export type LinkStatus = 'linked' | 'registered' | 'primary_changed' | 'replaced' | 'unchanged' | 'flagged';
export interface LinkResultDTO {
  status: LinkStatus;
  pointsAwarded: number;
  product: { gtin: string; title: string; photoUrl: string | null };
  /** EAN ativo após o voto (mais frequente). */
  primaryGtin: string;
  registrations: BarcodeRegistrationTallyDTO[];
  /** VOCR gravado neste voto (OCR do número impresso), se houver. */
  vocr: string | null;
}

export interface StoreProgressDTO {
  receipts: number;
  items: number;
  withEan: number;
}

export interface StoreRankDTO {
  store: StoreRefDTO & { address: string | null; lat: number | null; lng: number | null };
  distanceKm: number | null;
  index: number | null;
  position: number | null;
  of: number;
  comparableProducts: number;
  progress: StoreProgressDTO;
}

export interface StoreVitrineDTO {
  rank: StoreRankDTO;
  withEan: (ProductCardDTO & { here: { priceCents: number; observedAt: ISODate } })[];
  withoutEan: UnlinkedItemDTO[];
}

export interface ListSummaryDTO {
  id: string;
  name: string;
  itemCount: number;
  updatedAt: ISODate;
  /** melhor total “uma loja” (cobertura máxima), se houver preço */
  bestTotalCents: number | null;
}

export interface QuoteLineDTO {
  gtin: string;
  quantity: number;
  unitCents: number;
  subtotalCents: number;
  observedAt: ISODate;
}

export interface QuoteDTO {
  byStore: { store: StoreRefDTO; distanceKm: number | null; totalCents: number; found: number; missing: string[]; coverage: number; lines: QuoteLineDTO[] }[];
  split: {
    stores: { store: StoreRefDTO; distanceKm: number | null; subtotalCents: number; lines: QuoteLineDTO[] }[];
    totalCents: number;
    uncovered: string[];
    totalDistanceKm: number | null;
  };
  referenceStoreId: number | null;
  partial: boolean;
  savingCents: number;
  savingRatio: number;
}

export interface ListDetailDTO {
  id: string;
  name: string;
  items: { gtin: string; title: string; photoUrl: string | null; quantity: number }[];
  quote: QuoteDTO | null;
  credits: number;
}

export interface SpendingDTO {
  months: { month: string; totalCents: number; receipts: number }[];
  byStore: { store: StoreRefDTO; totalCents: number; receipts: number }[];
  byCategory: { category: string; totalCents: number }[];
}

export interface PointsDTO {
  balance: number;
  credits: number;
  events: { kind: 'receipt' | 'eanLink'; points: number; createdAt: ISODate; label: string }[];
}

export interface AdminMetricsDTO {
  stores: number;
  receipts: number;
  items: number;
  links: number;
  products: number;
  users: number;
  visitors: number;
  eanCoverage: number;
  pendingFailures: number;
  openFlags: number;
  receiptsByDay: { day: string; count: number }[];
}

export interface IngestFailureDTO {
  id: number;
  accessKey: string | null;
  errorCode: string;
  errorMessage: string | null;
  attempts: number;
  status: 'pending' | 'resolved' | 'failed';
  createdAt: ISODate;
  updatedAt: ISODate;
}

export interface ModerationFlagDTO {
  id: number;
  kind: 'ean_divergent' | 'price_outlier';
  summary: string;
  status: 'open' | 'resolved';
  createdAt: ISODate;
  itemId: number | null;
}
