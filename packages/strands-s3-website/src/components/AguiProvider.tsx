import { useAguiStrandsS3AguiAgent } from '../hooks/useAguiStrandsS3AguiAgent';
import {
  CopilotKitProvider,
  WildcardToolCallRender,
} from '@copilotkit/react-core/v2';
import '@copilotkit/react-core/v2/styles.css';
import { type FC, type PropsWithChildren, useMemo } from 'react';
import type { AbstractAgent } from '@ag-ui/client';

const renderToolCalls = [WildcardToolCallRender];

export const AguiProvider: FC<PropsWithChildren> = ({ children }) => {
  const strandsS3AguiAgentAgents = useAguiStrandsS3AguiAgent();
  const selfManagedAgents = useMemo<Record<string, AbstractAgent>>(
    () => ({ ...strandsS3AguiAgentAgents }),
    [strandsS3AguiAgentAgents],
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
