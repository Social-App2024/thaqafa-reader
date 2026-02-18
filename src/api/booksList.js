import { api } from "./client.js";

export async function ViewPurchasedBooks() {
  const { data } = await api.get("/reader/purchased-books");
  if (!data) throw new Error("Failed to fetch books list.");
  return data;
}
