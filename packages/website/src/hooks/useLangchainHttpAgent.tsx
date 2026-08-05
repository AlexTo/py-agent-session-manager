import { useContext } from 'react';
import { LangchainHttpAgentContext } from '../components/LangchainHttpAgentProvider';
import { LangchainHttpAgentOptionsProxy } from '../generated/langchain-http-agent/options-proxy.gen';

export const useLangchainHttpAgent = (): LangchainHttpAgentOptionsProxy => {
  const optionsProxy = useContext(LangchainHttpAgentContext);

  if (!optionsProxy) {
    throw new Error(
      'useLangchainHttpAgent must be used within a LangchainHttpAgentProvider',
    );
  }

  return optionsProxy;
};
