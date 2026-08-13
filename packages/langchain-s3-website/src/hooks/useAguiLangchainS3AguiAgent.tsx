import type { AbstractAgent, RunAgentInput } from '@ag-ui/client';
import { HttpAgent } from '@ag-ui/client';
import { useMemo } from 'react';
import { useRuntimeConfig } from './useRuntimeConfig';
import { type SigV4Client, useSigV4 } from './useSigV4';

function buildAgentCoreUrl(agentRuntimeArn: string): string {
  const region = agentRuntimeArn.split(':')[3];
  return `https://bedrock-agentcore.${region}.amazonaws.com/runtimes/${encodeURIComponent(agentRuntimeArn)}/invocations?qualifier=DEFAULT`;
}

// AgentCore session ids must be at least 33 characters.
function agentCoreSessionId(input: RunAgentInput): string {
  return (input.threadId ?? '').padEnd(33, '0');
}

class SigV4HttpAgent extends HttpAgent {
  sigV4Client: SigV4Client;

  constructor(
    config: ConstructorParameters<typeof HttpAgent>[0],
    sigV4Client: SigV4Client,
  ) {
    super({
      ...config,
      fetch: sigV4Client.fetch as (
        url: string,
        init: RequestInit,
      ) => Promise<Response>,
    });
    this.sigV4Client = sigV4Client;
  }

  protected override requestInit(input: RunAgentInput): RequestInit {
    const init = super.requestInit(input);
    init.headers = {
      ...(init.headers as Record<string, string>),
      'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id': agentCoreSessionId(input),
    };
    return init;
  }

  override clone(): SigV4HttpAgent {
    const cloned = super.clone() as SigV4HttpAgent;
    cloned.sigV4Client = this.sigV4Client;
    return cloned;
  }
}

export const useAguiLangchainS3AguiAgent = (): Record<
  string,
  AbstractAgent
> => {
  const runtimeConfig = useRuntimeConfig();
  const agentRuntimeValue = runtimeConfig.agentRuntimes.LangchainS3AguiAgent;
  const sigv4 = useSigV4();

  const url = useMemo(
    () =>
      agentRuntimeValue.startsWith('arn:')
        ? buildAgentCoreUrl(agentRuntimeValue)
        : agentRuntimeValue,
    [agentRuntimeValue],
  );

  return useMemo((): Record<string, AbstractAgent> => {
    const agent = new SigV4HttpAgent({ url }, sigv4);

    return { 'langchain-s3-agui-agent': agent };
  }, [url, sigv4]);
};
