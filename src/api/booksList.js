import { api } from "./client.js";

export async function ViewPurchasedBooks(profileId) {
  if (!profileId) throw new Error("Cannot view purchased books, invalid profile id.");
  const { data } = await api.get("/reader/purchased-books/"+profileId);
  if (!data) throw new Error("Failed to fetch books list.");
  return data;
}
