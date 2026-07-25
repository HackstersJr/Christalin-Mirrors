export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

/** parseInt('abc') is NaN, and Math.max(1, NaN) is NaN — which reaches Prisma as skip: NaN. */
function toInt(value: string | undefined, fallback: number): number {
  const n = parseInt(value ?? '', 10);
  return Number.isFinite(n) ? n : fallback;
}

export function parsePagination(query: { page?: string; limit?: string }): PaginationParams {
  const page = Math.max(1, toInt(query.page, 1));
  const limit = Math.min(100, Math.max(1, toInt(query.limit, 20)));
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

export function paginate<T>(items: T[], total: number, params: PaginationParams): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / params.limit);
  return {
    items,
    total,
    page: params.page,
    limit: params.limit,
    totalPages,
    hasNext: params.page < totalPages,
    hasPrev: params.page > 1,
  };
}
