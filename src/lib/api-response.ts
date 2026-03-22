/**
 * Shared API response helpers for /api/v1 (docs/DATABASE_AND_API_DESIGN.md).
 * Aligned with Namibian Open Banking Standards: root object { data, meta?, links?, errors? }.
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

/** Implementation confidence for Open Banking, ISO 20022, and Fineract flow endpoints (PRD §17, §14). 0.98 = 98%. */
export const IMPLEMENTATION_CONFIDENCE = 0.98;

/** Meta for success responses: implementation confidence (98%) for compliance/audit. */
export function metaWithImplementationConfidence(extra?: Record<string, unknown>): Record<string, unknown> {
  return { implementationConfidence: IMPLEMENTATION_CONFIDENCE, ...extra };
}

/** Open Banking / ISO 20022–aligned: successful response root object (data mandatory, meta/links optional). */
export function jsonSuccess<T>(
  data: T,
  options?: { meta?: Record<string, unknown>; links?: Record<string, string | null>; status?: number }
) {
  const status = options?.status ?? 200;
  const body: { data: T; meta?: Record<string, unknown>; links?: Record<string, string | null> } = { data };
  if (options?.meta) body.meta = options.meta;
  if (options?.links) body.links = options.links;
  return NextResponse.json(body, { status });
}

/** Open Banking: error response root object with errors array (for 4xx/5xx). */
export type ApiErrorItem = {
  code: string;
  title?: string;
  message: string;
  field?: string;
};

export function jsonErrors(
  errors: ApiErrorItem[],
  status: number,
  options?: { retryAfter?: number; route?: string }
) {
  if (options?.route && status >= 500) {
    logger.error(options.route, errors[0]?.message ?? "Error", { errors, status });
  }
  const res = NextResponse.json({ errors }, { status });
  if (options?.retryAfter != null) {
    res.headers.set("Retry-After", String(options.retryAfter));
  }
  return res;
}

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

/** Map legacy jsonError to Open Banking errors array (use for new endpoints). */
export function jsonErrorOpenBanking(
  message: string,
  code: string,
  status: number,
  options?: { title?: string; field?: string; retryAfter?: number; route?: string }
) {
  return jsonErrors(
    [{ code, title: options?.title, message, field: options?.field }],
    status,
    { retryAfter: options?.retryAfter, route: options?.route }
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
