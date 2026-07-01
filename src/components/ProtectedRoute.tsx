import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authstore';
import { fetchUserInfo } from '@/api/userInfoAPI';
import { LoadingScreen } from '@/components/login-loading-screen';

type Status = 'checking' | 'authorized' | 'redirecting';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>('checking');

  useEffect(() => {
    const runCheck = () => {
      const { accessToken, clearAuth, setUserInfo, userInfo } = useAuthStore.getState();

      if (!accessToken) {
        navigate('/', { replace: true });
        setStatus('redirecting');
        return;
      }

      if (userInfo) {
        setStatus('authorized');
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
    };

    if (useAuthStore.persist.hasHydrated()) {
      runCheck();
    } else {
      const unsub = useAuthStore.persist.onFinishHydration(runCheck);
      return unsub;
    }
  }, [navigate]);

  if (status === 'checking') return <LoadingScreen />;
  if (status === 'redirecting') return null;
  return <>{children}</>;
}
