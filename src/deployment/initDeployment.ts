import { BACKEND_URL, setBackendBaseUrl } from '@/axios/axiosSetup';
import { getDeploymentStatus, startDeployment } from '@/api/deploymentAPI';
import { useDeploymentStore } from '@/store/deploymentstore';

const POLL_INTERVAL_MS = 5000;
// const DEPLOYMENT_PORT = 8000;

async function pollUntilRunning(ip: string) {
  try {
    const status = await getDeploymentStatus(ip);
    useDeploymentStore.getState().setStatus(status);

    if (status.status === 'RUNNING') {
      // const baseUrl = `http://${status.publicIp}:${DEPLOYMENT_PORT}`;
      const baseUrl = `${ip}`;
      setBackendBaseUrl(baseUrl);
      useDeploymentStore.getState().setReady(baseUrl);
      return;
    }
  } catch {
    // Transient failure — keep polling on the same interval.
  }

  setTimeout(() => pollUntilRunning(ip), POLL_INTERVAL_MS);
}

// Entry point called once at app bootstrap (see main.tsx). In development the
// API base URL is static and known up front, so the deployment/start + poll
// flow is skipped entirely.
export async function initDeployment() {
  if (import.meta.env.VITE_ENVIRONMENT === 'development') {
    useDeploymentStore.getState().setReady(BACKEND_URL);
    return;
  }

  const ip = import.meta.env.VITE_DEPLOYMENT_IP;

  try {
    await startDeployment(ip);
  } catch {
    // The instance may already be starting from a previous call — fall
    // through to polling regardless.
  }

  pollUntilRunning(ip);
}
