import { StrandsHttpAgent } from '../generated/strands-http-agent/client.gen';
import { StrandsHttpAgentClientContext } from '../components/StrandsHttpAgentProvider';
import { useContext } from 'react';

export const useStrandsHttpAgentClient = (): StrandsHttpAgent => {
  const client = useContext(StrandsHttpAgentClientContext);

  if (!client) {
    throw new Error(
      'useStrandsHttpAgentClient must be used within a StrandsHttpAgentProvider',
    );
  }

  return client;
};
