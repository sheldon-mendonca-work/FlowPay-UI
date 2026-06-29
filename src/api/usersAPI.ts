import { useQuery } from '@tanstack/react-query';
import { publicAxios, ApiError } from '@/axios/axiosSetup';
import type { ApiResponse } from '@/axios/axiosSetup';

export interface DefaultUser {
  id: string;
  name: string;
  email: string;
  balance: number;
  currency: string;
}

async function fetchUserList(): Promise<DefaultUser[]> {
  try {
    const { data: envelope } = await publicAxios.get<ApiResponse<DefaultUser[]>>(
      '/users/getDefaultUserList',
    );

    if (!envelope.success || envelope.code !== 200) {
      throw new ApiError(String(envelope.code), envelope.message ?? `Request failed with code ${envelope.code}`);
    }

    return envelope.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new Error('Failed to fetch user list');
  }
}

export function useUserListQuery({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: ['users', 'defaultList'],
    queryFn: fetchUserList,
    staleTime: 5 * 60 * 1000,
    enabled,
  });
}
