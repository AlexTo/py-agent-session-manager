// Chat CLI for LangchainS3HttpAgent (Python FastAPI / JSONL streaming), using the
// generated client. Connects to the local `dev` server, or the deployed
// agent when `RUNTIME_CONFIG_APP_ID` is set.
import { chatLoop, type ChatAdapter } from 'agent-chat-cli';
import { LangchainS3HttpAgent } from './generated/client.gen.js';
import {
  createAgentCoreFetch,
  resolveRemoteAgent,
  SESSION_ID,
} from './agentcore.js';

const SESSION_ID_HEADER = 'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id';

const remote = await resolveRemoteAgent();

class LangchainS3HttpAgentAdapter implements ChatAdapter {
  private client!: LangchainS3HttpAgent;

  async connect(url: string) {
    this.client = remote
      ? new LangchainS3HttpAgent({
          url: `https://bedrock-agentcore.${remote.region}.amazonaws.com/runtimes/${encodeURIComponent(remote.arn)}`,
          fetch: createAgentCoreFetch(remote.region),
        })
      : new LangchainS3HttpAgent({
          url,
          fetch: (input, init) => {
            const headers = new Headers(init?.headers);
            headers.set(SESSION_ID_HEADER, SESSION_ID);
            return fetch(input, { ...init, headers });
          },
        });
    return { agentName: 'LangchainS3HttpAgent' };
  }

  async *sendMessage(text: string): AsyncIterable<string> {
    for await (const chunk of this.client.invoke({ prompt: text })) {
      if (typeof chunk.content === 'string') yield chunk.content;
    }
  }
}

await chatLoop(new LangchainS3HttpAgentAdapter(), process.env.URL ?? '');
