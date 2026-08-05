import { baseApi } from './baseApi';
import { APIs } from '@/configs/apiClient';
import { AuditResult } from '@/types/audit';

export const auditApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createAudit: builder.mutation<any, { url: string; anonymous?: boolean }>({
      query: (body) => ({
        url: APIs.audit.create,
        method: 'POST',
        body,
      }),
    }),
    getAuditResult: builder.query<any, string>({
      query: (id) => ({ url: APIs.audit.result(id) }),
    }),
  }),
});

export const {
  useCreateAuditMutation,
  useGetAuditResultQuery,
  useLazyGetAuditResultQuery,
} = auditApi;
