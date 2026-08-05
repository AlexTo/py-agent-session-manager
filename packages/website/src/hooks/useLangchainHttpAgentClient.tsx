import { LangchainHttpAgent } from '../generated/langchain-http-agent/client.gen';
import { LangchainHttpAgentClientContext } from '../components/LangchainHttpAgentProvider';
import { useContext } from 'react';

export const useLangchainHttpAgentClient = (): LangchainHttpAgent => {
  const client = useContext(LangchainHttpAgentClientContext);

  if (!client) {
    throw new Error(
      'useLangchainHttpAgentClient must be used within a LangchainHttpAgentProvider',
    );
  }

  return client;
};
