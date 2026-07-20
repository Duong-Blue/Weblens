import { baseApi } from './baseApi';
import { APIs } from '@/configs/apiClient';

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createAudit: builder.mutation<any, { url: string; anonymous?: boolean }>({
      query: (body) => ({
        url: APIs.audit.create,
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Audit'],
    }),
    getAudits: builder.query<
      { data: any[]; meta: { total: number; page: number; limit: number; totalPages: number } },
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 10 }) => ({
        url: APIs.audit.list,
        params: { page, limit },
      }),
      providesTags: ['Audit'],
    }),
    getAuditResult: builder.query<any, string>({
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
