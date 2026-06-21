export type PackageRecord = {
  id: string;
  name: string;
  price: number;
  original_price?: number | null;
  list_price?: number | null;
  sale_price?: number | null;
  sale_starts_at?: string | null;
  sale_ends_at?: string | null;
  credits: number;
  type: string;
  is_active?: number | boolean | null;
};

function toMillis(value?: string | null) {
  if (!value) return null;
  const normalized = String(value).includes('T') ? String(value) : String(value).replace(' ', 'T');
  const ms = Date.parse(normalized);
  return Number.isNaN(ms) ? null : ms;
}

export function getEffectivePackagePrice(pkg: PackageRecord, now = new Date()) {
  const listPrice = Number(pkg.list_price ?? pkg.original_price ?? pkg.price ?? 0);
  const salePrice = pkg.sale_price === null || pkg.sale_price === undefined ? null : Number(pkg.sale_price);
  const startsAt = toMillis(pkg.sale_starts_at);
  const endsAt = toMillis(pkg.sale_ends_at);
  const nowMs = now.getTime();
  const saleStarted = startsAt === null || nowMs >= startsAt;
  const saleNotEnded = endsAt === null || nowMs < endsAt;
  const saleActive = salePrice !== null && salePrice >= 0 && saleStarted && saleNotEnded;

  return {
    listPrice,
    salePrice,
    effectivePrice: saleActive ? salePrice : listPrice,
    saleActive,
  };
}
