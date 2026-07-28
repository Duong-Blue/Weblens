import { baseApi } from './baseApi';
import { APIs } from '@/configs/apiClient';
import { AuditResult } from '@/types/audit';

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createAudit: builder.mutation<{ audit?: { id?: string }, data?: { audit?: { id?: string; auditId?: string } } }, { url: string; anonymous?: boolean }>({
      query: (body) => ({
        url: APIs.audit.create,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Audit'],
    }),
    getAudits: builder.query<
      { data: Record<string, unknown>[]; meta: { total: number; page: number; limit: number; totalPages: number } },
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => ({
        url: APIs.audit.list,
        params: { page, limit },
      }),
      providesTags: ['Audit'],
    }),
    getAuditResult: builder.query<{ data?: { audit?: { status?: string, url?: string }, result?: AuditResult } }, string>({
      query: (id) => ({ url: APIs.audit.result(id) }),
    }),
  }),
});

export const {
  useCreateAuditMutation,
  useGetAuditsQuery,
  useGetAuditResultQuery,
  useLazyGetAuditResultQuery,
} = auditApi;
