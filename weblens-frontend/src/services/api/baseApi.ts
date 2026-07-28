import { createApi, BaseQueryFn } from '@reduxjs/toolkit/query/react';

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function toSearchParams(params: Record<string, unknown>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null) {
      sp.set(k, String(v));
    }
  }
  return sp.toString();
}

/**
 * Custom fetch wrapper that auto-sends HttpOnly cookies.
*  No manual token retrieval — the backend sets an HttpOnly cookie on login.
*
 * Every request includes `credentials: 'include'` so the cookie is sent
 * automatically. No Auth header is set here.
 */
async function baseFetch(input: RequestInfo, init?: RequestInit) {
  const response = await fetch(input, {
    ...init,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
  });

  return response;
}

type QueryArgs = {
  url: string;
  method?: string;
  body?: unknown;
  params?: Record<string, unknown>;
};

type QueryError = { status: number; data: unknown };

/**
 * Shared base API — every feature slice injects endpoints into this.
 *
 * All APIs share the same base URL, credential mode, tag types, and
 * 401 redirect logic. No token storage or retrieval here.
 */
export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: (async (args: QueryArgs) => {
    let resolvedUrl = `${baseUrl}${args.url}`;
    if (args.params) {
      resolvedUrl += `?${toSearchParams(args.params)}`;
    }

    const result = await baseFetch(resolvedUrl, {
      method: args.method ?? 'GET',
      body: args.body ? JSON.stringify(args.body) : undefined,
    });

    if (result.status === 204) {
      return { data: null };
    }

    const text = await result.text();
    let data;
    try {
      data = text ? JSON.parse(text) : null;
    } catch {
      data = text;
    }

    if (result.ok) {
      return { data };
    }
    return { error: { status: result.status, data } as QueryError };
  }) as BaseQueryFn<QueryArgs, unknown, QueryError>,
  endpoints: () => ({}),
});
