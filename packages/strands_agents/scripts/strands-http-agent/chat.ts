// Chat CLI for StrandsHttpAgent (Python FastAPI / JSONL streaming), using the
// generated client. Connects to the local `dev` server, or the deployed
// agent when `RUNTIME_CONFIG_APP_ID` is set.
import { chatLoop, type ChatAdapter } from 'agent-chat-cli';
import { StrandsHttpAgent } from './generated/client.gen.js';
import {
  createAgentCoreFetch,
  resolveRemoteAgent,
  SESSION_ID,
} from './agentcore.js';

const SESSION_ID_HEADER = 'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id';

const remote = await resolveRemoteAgent();

class StrandsHttpAgentAdapter implements ChatAdapter {
  private client!: StrandsHttpAgent;

  async connect(url: string) {
    this.client = remote
      ? new StrandsHttpAgent({
          url: `https://bedrock-agentcore.${remote.region}.amazonaws.com/runtimes/${encodeURIComponent(remote.arn)}`,
          fetch: createAgentCoreFetch(remote.region),
        })
      : new StrandsHttpAgent({
          url,
          fetch: (input, init) => {
            const headers = new Headers(init?.headers);
            headers.set(SESSION_ID_HEADER, SESSION_ID);
            return fetch(input, { ...init, headers });
          },
        });
    return { agentName: 'StrandsHttpAgent' };
  }

  async *sendMessage(text: string): AsyncIterable<string> {
    for await (const chunk of this.client.invoke({ prompt: text })) {
      if (typeof chunk.content === 'string') yield chunk.content;
    }
  }
}

await chatLoop(new StrandsHttpAgentAdapter(), process.env.URL ?? '');
