import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authstore';
import { fetchUserInfo } from '@/api/userInfoAPI';
import { LoadingScreen } from '@/components/login-loading-screen';

type Status = 'checking' | 'authorized' | 'redirecting';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const _hydrated = useAuthStore((s) => s._hydrated);
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    if (!_hydrated) return;

    const { accessToken, clearAuth, setUserInfo } = useAuthStore.getState();

    if (!accessToken) {
      navigate('/', { replace: true });
      setStatus('redirecting');
      return;
    }

    fetchUserInfo()
      .then((info) => {
        setUserInfo(info);
        setStatus('authorized');
      })
      .catch(() => {
        clearAuth();
        navigate('/', { replace: true });
        setStatus('redirecting');
      });
  }, [_hydrated, navigate]);

  if (status === 'checking') return <LoadingScreen />;
  if (status === 'redirecting') return null;
  return <>{children}</>;
}
