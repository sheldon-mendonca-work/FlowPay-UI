import { publicAxios, ApiError } from '@/axios/axiosSetup';
import type { ApiResponse } from '@/axios/axiosSetup';

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
}

export async function loginDefault(
  accountId: string,
  accountType: 'ACCOUNT' | 'USER',
): Promise<AuthResponse> {
  const endpoint =
    accountType === 'ACCOUNT' ? '/auth/defaultLoginAccount' : '/auth/defaultLoginUser';

  const { data: envelope } = await publicAxios.post<ApiResponse<AuthResponse>>(endpoint, {
    account_id: accountId,
    account_type: accountType,
  });

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? `Login failed with code ${envelope.code}`,
    );
  }

  return envelope.data;
}
