import {
  CopilotKitProvider,
  WildcardToolCallRender,
} from '@copilotkit/react-core/v2';
import { useAguiLangchainS3AguiAgent } from '../hooks/useAguiLangchainS3AguiAgent';
import '@copilotkit/react-core/v2/styles.css';
import type { AbstractAgent } from '@ag-ui/client';
import { type FC, type PropsWithChildren, useMemo } from 'react';

const renderToolCalls = [WildcardToolCallRender];

export const AguiProvider: FC<PropsWithChildren> = ({ children }) => {
  const langchainS3AguiAgentAgents = useAguiLangchainS3AguiAgent();
  const selfManagedAgents = useMemo<Record<string, AbstractAgent>>(
    () => ({ ...langchainS3AguiAgentAgents }),
    [langchainS3AguiAgentAgents],
  );

  return (
    <CopilotKitProvider
      selfManagedAgents={selfManagedAgents}
      renderToolCalls={renderToolCalls}
    >
      {children}
    </CopilotKitProvider>
  );
};

export default AguiProvider;
