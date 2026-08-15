import { BACKEND_URL, setBackendBaseUrl } from '@/axios/axiosSetup';
import { getDeploymentStatus, sendDeploymentHeartbeat, startDeployment } from '@/api/deploymentAPI';
import { useDeploymentStore } from '@/store/deploymentstore';

const POLL_INTERVAL_MS = 5000;
const HEARTBEAT_INTERVAL_MS = 10 * 60 * 1000;
// const DEPLOYMENT_PORT = 8000;
let heartbeatStarted = false;

function scheduleHeartbeat(ip: string) {
  const sendHeartbeat = () => {
    // Browser support
    if ('requestIdleCallback' in window) {
      window.requestIdleCallback(
        async () => {
          try {
            await sendDeploymentHeartbeat(ip);
          } catch {
            // Heartbeat failure is transient; don't disrupt the app.
          }

          scheduleHeartbeat(ip);
        },
        { timeout: 30_000 }
      );
    } else {
      // Fallback for browsers without requestIdleCallback
      sendDeploymentHeartbeat(ip)
        .catch(() => {})
        .finally(()=>scheduleHeartbeat(ip));
    }
  };

  setTimeout(sendHeartbeat, HEARTBEAT_INTERVAL_MS);
}

function startHeartbeat(ip: string) {
  if (heartbeatStarted) {
    return;
  }

  heartbeatStarted = true;
  scheduleHeartbeat(ip);
}

async function pollUntilRunning(ip: string) {
  try {
    const status = await getDeploymentStatus(ip);
    useDeploymentStore.getState().setStatus({ ...status, publicIp: BACKEND_URL});
    
    if (status.status === 'RUNNING') {
      // const baseUrl = `http://${status.publicIp}:${DEPLOYMENT_PORT}`;
      // const baseUrl = `${ip}`;
      const baseUrl = BACKEND_URL;
      setBackendBaseUrl(baseUrl);
      startHeartbeat(baseUrl);
      
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
