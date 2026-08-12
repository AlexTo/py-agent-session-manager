// Chat CLI for StrandsS3AguiAgent (AG-UI protocol). Connects to the local
// `dev` server, or the deployed agent when `RUNTIME_CONFIG_APP_ID` is set.
import { AGUIChatAdapter, chatLoop } from 'agent-chat-cli';
import { createAgentCoreFetch, resolveRemoteAgent } from './agentcore.js';

const remote = await resolveRemoteAgent();

const url = remote
  ? `https://bedrock-agentcore.${remote.region}.amazonaws.com/runtimes/${encodeURIComponent(remote.arn)}/invocations?qualifier=DEFAULT`
  : process.env.URL!;

// Remote requests are authenticated via a custom fetch; locally the default agent talks plain HTTP.
const fetchImpl = remote ? createAgentCoreFetch(remote.region) : undefined;

await chatLoop(new AGUIChatAdapter({ fetch: fetchImpl }), url);
