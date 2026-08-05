import { createContext, FC, PropsWithChildren, useMemo } from 'react';
import { LangchainHttpAgent } from '../generated/langchain-http-agent/client.gen';
import { LangchainHttpAgentOptionsProxy } from '../generated/langchain-http-agent/options-proxy.gen';
import { useRuntimeConfig } from '../hooks/useRuntimeConfig';
import { useSigV4 } from '../hooks/useSigV4';

/**
 * Build an HTTP URL from a Bedrock AgentCore Runtime ARN
 */
function buildAgentCoreHttpUrl(agentRuntimeArn: string): string {
  const region = agentRuntimeArn.split(':')[3];
  return `https://bedrock-agentcore.${region}.amazonaws.com/runtimes/${encodeURIComponent(agentRuntimeArn)}`;
}

export const LangchainHttpAgentContext = createContext<
  LangchainHttpAgentOptionsProxy | undefined
>(undefined);

export const LangchainHttpAgentClientContext = createContext<
  LangchainHttpAgent | undefined
>(undefined);

const useCreateLangchainHttpAgentClient = (): LangchainHttpAgent => {
  const runtimeConfig = useRuntimeConfig();
  const agentRuntimeValue = runtimeConfig.agentRuntimes.LangchainHttpAgent;
  // A local-dev override is a plain URL; otherwise it's the agent's runtime
  // ARN, so build the invocation URL from it.
  const apiUrl = agentRuntimeValue.startsWith('arn:')
    ? buildAgentCoreHttpUrl(agentRuntimeValue)
    : agentRuntimeValue;
  const sigv4Client = useSigV4();
  return useMemo(
    () =>
      new LangchainHttpAgent({
        url: apiUrl,
        fetch: sigv4Client.fetch,
      }),
    [apiUrl, sigv4Client],
  );
};

export const LangchainHttpAgentProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const client = useCreateLangchainHttpAgentClient();
  const optionsProxy = useMemo(
    () => new LangchainHttpAgentOptionsProxy({ client }),
    [client],
  );

  return (
    <LangchainHttpAgentClientContext.Provider value={client}>
      <LangchainHttpAgentContext.Provider value={optionsProxy}>
        {children}
      </LangchainHttpAgentContext.Provider>
    </LangchainHttpAgentClientContext.Provider>
  );
};

export default LangchainHttpAgentProvider;
