import { useCreateAuditMutation, useLazyGetAuditResultQuery } from '@/services/api/auditApi';

export const useCreateAudit = () => {
    return useCreateAuditMutation();
};

export const useLazyAuditResult = () => {
  return useLazyGetAuditResultQuery();
};
