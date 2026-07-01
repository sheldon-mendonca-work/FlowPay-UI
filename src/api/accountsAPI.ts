import { useQuery } from '@tanstack/react-query';
import { publicAxios, ApiError } from '@/axios/axiosSetup';
import type { ApiResponse } from '@/axios/axiosSetup';

export interface DefaultAccount {
  account_id: string;
  account_name: string;
  currency: string;
  account_type: string;
  payment_handle: string;
  company_name: string;
  description: string;
}

async function fetchAccountsList(): Promise<DefaultAccount[]> {
  try {
    const { data: envelope } = await publicAxios.get<ApiResponse<{accounts: DefaultAccount[]}>>(
      '/accounts/defaults/accounts',
    );

    
    if ((!envelope.success) || (envelope.code !== 200)) {
      throw new ApiError(envelope.code.toString(), envelope.message ?? `Request failed with code ${envelope.code}`);
    }
    
    return envelope?.data?.accounts || [];
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Failed to fetch accounts list');
  }
}

export function useAccountsListQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['accounts', 'defaultList'],
    queryFn: fetchAccountsList,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
