import { useAguiLangchainDynamodbAguiAgent } from '../hooks/useAguiLangchainDynamodbAguiAgent';
import {
  CopilotKitProvider,
  WildcardToolCallRender,
} from '@copilotkit/react-core/v2';
import '@copilotkit/react-core/v2/styles.css';
import { type FC, type PropsWithChildren, useMemo } from 'react';
import type { AbstractAgent } from '@ag-ui/client';

const renderToolCalls = [WildcardToolCallRender];

export const AguiProvider: FC<PropsWithChildren> = ({ children }) => {
  const langchainDynamodbAguiAgentAgents = useAguiLangchainDynamodbAguiAgent();
  const selfManagedAgents = useMemo<Record<string, AbstractAgent>>(
    () => ({ ...langchainDynamodbAguiAgentAgents }),
    [langchainDynamodbAguiAgentAgents],
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
