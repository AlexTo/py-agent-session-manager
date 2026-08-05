import { useContext } from 'react';
import { StrandsHttpAgentContext } from '../components/StrandsHttpAgentProvider';
import { StrandsHttpAgentOptionsProxy } from '../generated/strands-http-agent/options-proxy.gen';

export const useStrandsHttpAgent = (): StrandsHttpAgentOptionsProxy => {
  const optionsProxy = useContext(StrandsHttpAgentContext);

  if (!optionsProxy) {
    throw new Error(
      'useStrandsHttpAgent must be used within a StrandsHttpAgentProvider',
    );
  }

  return optionsProxy;
};
