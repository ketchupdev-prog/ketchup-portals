/**
 * Shared API response helpers for /api/v1 (docs/DATABASE_AND_API_DESIGN.md).
 * Location: src/lib/api-response.ts
 */

import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export type PaginationMeta = {
  totalRecords: number;
  totalPages: number;
  page: number;
  limit: number;
};

export type PaginationLinks = {
  first: string;
  prev: string | null;
  next: string | null;
  last: string;
};

export function paginationLinks(
  basePath: string,
  page: number,
  limit: number,
  totalPages: number,
  query?: Record<string, string>
): PaginationLinks {
  const build = (p: number) => {
    const q = new URLSearchParams(query as Record<string, string>);
    q.set("page", String(p));
    q.set("limit", String(limit));
    return `${basePath}?${q.toString()}`;
  };
  return {
    first: build(1),
    prev: page > 1 ? build(page - 1) : null,
    next: page < totalPages ? build(page + 1) : null,
    last: build(totalPages),
  };
}

export function jsonPaginated<T>(
  data: T[],
  meta: PaginationMeta,
  links: PaginationLinks,
  status = 200
) {
  return NextResponse.json({ data, meta, links }, { status });
}

export function jsonError(
  error: string,
  errorType: string,
  details?: Record<string, unknown>,
  status = 400,
  route?: string
) {
  if (route && status >= 500) {
    logger.error(route, error, { errorType, status, details });
  }
  return NextResponse.json(
    { success: false, error, error_type: errorType, details: details ?? null },
    { status }
  );
}

export function parsePagination(searchParams: URLSearchParams) {
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(
    100,
    Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20)
  );
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}
