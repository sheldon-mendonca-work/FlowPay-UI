import axios from 'axios';

const DEPLOYMENT_PORT = 8000;

export interface DeploymentStatus {
  state: string;
  instanceId: string;
  publicIp: string;
  healthy: boolean;
}

function deploymentUrl(ip: string, path: string) {
  return `http://${ip}:${DEPLOYMENT_PORT}${path}`;
}

export function startDeployment(ip: string) {
  return axios.post(deploymentUrl(ip, '/deployment/start'));
}

export async function getDeploymentStatus(ip: string): Promise<DeploymentStatus> {
  const { data } = await axios.get<DeploymentStatus>(deploymentUrl(ip, '/deployment/status'));
  return data;
}
