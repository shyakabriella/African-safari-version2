export interface Hotel {
  id: number;
  name: string;
  slug: string;
  location: string;
  imageUrl: string | null;
  priceFrom: number | null;
  currency: string;
}
