import { useCreateAuditMutation, useGetAuditResultQuery } from '@/services/api/auditApi';

export const useCreateAudit = () => {
    return useCreateAuditMutation();
};

export const useAuditResult = (id: string | null) => {
  return useGetAuditResultQuery(id || '', { skip: !id });
};
