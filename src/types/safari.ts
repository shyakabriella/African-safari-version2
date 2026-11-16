export interface Safari {
  id: number;
  title: string;
  slug: string;
  destination: string;
  durationDays: number;
  priceFrom: number | null;
  currency: string;
  imageUrl: string | null;
}
