import { createFileRoute } from '@tanstack/react-router';
import { CopilotChat } from '../components/copilot';

export const Route = createFileRoute('/')({
  component: RouteComponent,
});

function RouteComponent() {
  return (
    <div className="h-[600px] text-left">
      <CopilotChat
        agentId="langchain-s3-agui-agent"
        labels={{
          welcomeMessageText: 'How can I help you today?',
          chatInputPlaceholder: 'Ask me anything...',
        }}
      />
    </div>
  );
}
