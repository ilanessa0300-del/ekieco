const REVIEWS_KEY = "ekieco_reviews";

export interface Review {
  id: string;
  authorPhone: string;
  targetUserId: number;
  rating: number;
  text: string;
  createdAt: string;
}

export function getReviews(targetUserId: number): Review[] {
  const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]") as Review[];
  return all.filter(r => r.targetUserId === targetUserId);
}

export function addReview(review: Omit<Review, "id" | "createdAt">): Review {
  const all = JSON.parse(localStorage.getItem(REVIEWS_KEY) || "[]") as Review[];
  const newReview: Review = {
    ...review,
    id: `${Date.now()}-${Math.random()}`,
    createdAt: new Date().toISOString(),
  };
  all.push(newReview);
  localStorage.setItem(REVIEWS_KEY, JSON.stringify(all));
  return newReview;
}

export function averageRating(reviews: Review[]): number {
  if (reviews.length === 0) return 0;
  return reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
}
