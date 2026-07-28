/**
 * Centralised API endpoint paths.
 *
 * Every API route lives here once. Feature slices import from this file
 * instead of hard-coding URL strings — when the backend changes, you
 * change one file.
 *
 * Authentication is handled by HttpOnly cookies (set by the backend on
 * login). There is no manual token storage or retrieval — every request
 * includes credentials automatically via `credentials: 'include'` in the
 * fetch wrapper (see `services/api/baseApi.ts`).
 */
export const APIs = {
  audit: {
    create: '/audits',
    list: '/audits',
    result: (id: string) => `/audits/${id}/result`,
  },
};


