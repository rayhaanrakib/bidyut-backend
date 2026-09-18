export function getPagination(query: Record<string, unknown>, defaultSortBy = "createdAt") {
  const page = Math.max(1, Number(query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(query.limit) || 10));
  const skip = (page - 1) * limit;
  const sortBy = (query.sortBy as string) || defaultSortBy;
  const sortOrder = query.sortOrder === "asc" ? "asc" : "desc";
  const meta = (total: number) => ({ page, limit, total, totalPages: Math.ceil(total / limit) });
  return { limit, skip, sortBy, sortOrder, meta };
}
