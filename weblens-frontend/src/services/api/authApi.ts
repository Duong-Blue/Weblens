import { baseApi } from './baseApi';
import { APIs } from '@/configs/apiClient';
import { User } from '@/types';

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    login: builder.mutation<any, any>({
      query: (credentials) => ({
        url: APIs.auth.login,
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<any, any>({
      query: (userData) => ({
        url: APIs.auth.register,
        method: 'POST',
        body: userData,
      }),
    }),
    getProfile: builder.query<{ data: User }, void>({
      query: () => ({ url: APIs.auth.profile }),
      providesTags: ['User'],
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: APIs.auth.logout,
        method: 'POST',
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useGetProfileQuery,
  useLogoutMutation,
} = authApi;
