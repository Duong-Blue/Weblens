import { useCreateAuditMutation, useGetAuditsQuery, useGetAuditResultQuery } from '@/services/api/auditApi';

export const useCreateAudit = () => {
    return useCreateAuditMutation();
};

export const useAudits = (page: number = 1, limit: number = 10) => {
  return useGetAuditsQuery({ page, limit });
};

export const useAuditResult = (id: string | null) => {
  return useGetAuditResultQuery(id || '', { skip: !id });
};
