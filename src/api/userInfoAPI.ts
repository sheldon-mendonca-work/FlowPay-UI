import { protectedAxios, ApiError } from '@/axios/axiosSetup';
import type { ApiResponse } from '@/axios/axiosSetup';
import type { UserInfoResponse } from '@/types/types';

export async function fetchUserInfo(): Promise<UserInfoResponse> {
  const { data: envelope } = await protectedAxios.get<ApiResponse<UserInfoResponse>>(
    '/accounts/userinfo',
  );

  if (!envelope.success || envelope.code !== 200) {
    throw new ApiError(
      envelope.code.toString(),
      envelope.message ?? `Failed to fetch user info (code ${envelope.code})`,
    );
  }

  return envelope.data;
}
