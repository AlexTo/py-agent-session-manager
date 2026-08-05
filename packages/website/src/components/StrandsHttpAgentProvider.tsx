import { createContext, FC, PropsWithChildren, useMemo } from 'react';
import { StrandsHttpAgent } from '../generated/strands-http-agent/client.gen';
import { StrandsHttpAgentOptionsProxy } from '../generated/strands-http-agent/options-proxy.gen';
import { useRuntimeConfig } from '../hooks/useRuntimeConfig';
import { useSigV4 } from '../hooks/useSigV4';

/**
 * Build an HTTP URL from a Bedrock AgentCore Runtime ARN
 */
function buildAgentCoreHttpUrl(agentRuntimeArn: string): string {
  const region = agentRuntimeArn.split(':')[3];
  return `https://bedrock-agentcore.${region}.amazonaws.com/runtimes/${encodeURIComponent(agentRuntimeArn)}`;
}

export const StrandsHttpAgentContext = createContext<
  StrandsHttpAgentOptionsProxy | undefined
>(undefined);

export const StrandsHttpAgentClientContext = createContext<
  StrandsHttpAgent | undefined
>(undefined);

const useCreateStrandsHttpAgentClient = (): StrandsHttpAgent => {
  const runtimeConfig = useRuntimeConfig();
  const agentRuntimeValue = runtimeConfig.agentRuntimes.StrandsHttpAgent;
  // A local-dev override is a plain URL; otherwise it's the agent's runtime
  // ARN, so build the invocation URL from it.
  const apiUrl = agentRuntimeValue.startsWith('arn:')
    ? buildAgentCoreHttpUrl(agentRuntimeValue)
    : agentRuntimeValue;
  const sigv4Client = useSigV4();
  return useMemo(
    () =>
      new StrandsHttpAgent({
        url: apiUrl,
        fetch: sigv4Client.fetch,
      }),
    [apiUrl, sigv4Client],
  );
};

export const StrandsHttpAgentProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const client = useCreateStrandsHttpAgentClient();
  const optionsProxy = useMemo(
    () => new StrandsHttpAgentOptionsProxy({ client }),
    [client],
  );

  return (
    <StrandsHttpAgentClientContext.Provider value={client}>
      <StrandsHttpAgentContext.Provider value={optionsProxy}>
        {children}
      </StrandsHttpAgentContext.Provider>
    </StrandsHttpAgentClientContext.Provider>
  );
};

export default StrandsHttpAgentProvider;
