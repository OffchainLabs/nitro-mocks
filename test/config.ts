/**
 * Returns the appropriate JSON RPC URL based on the environment.
 * When running in Docker, we need to use host.docker.internal to access
 * the host machine's localhost from within the container.
 */
export function getTestNodeRpcUrl(): string {
  return process.env.IS_DOCKER ? "http://host.docker.internal:8547" : "http://localhost:8547";
}