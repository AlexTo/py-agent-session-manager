import {
  LangchainS3A2aAgent,
  LangchainS3AguiAgent,
  LangchainS3HttpAgent,
  LangchainS3McpServer,
  LangchainS3Website,
  UserIdentity,
} from '@my-py-agents/common-constructs';
import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Shared Cognito user/identity pool backing the website's login and the
    // AGUI agent's browser-side SigV4 credentials.
    // Dev-friendly: skip MFA for this sandbox deployment.
    const identity = new UserIdentity(this, 'Identity', {
      requireMfa: false,
    });

    const mcpServer = new LangchainS3McpServer(this, 'LangchainS3McpServer');
    const httpAgent = new LangchainS3HttpAgent(this, 'LangchainS3HttpAgent');
    const a2aAgent = new LangchainS3A2aAgent(this, 'LangchainS3A2aAgent');
    const aguiAgent = new LangchainS3AguiAgent(this, 'LangchainS3AguiAgent');

    // Agents -> MCP
    mcpServer.grantInvokeAccess(httpAgent);
    mcpServer.grantInvokeAccess(a2aAgent);
    mcpServer.grantInvokeAccess(aguiAgent);

    // AGUI -> A2A / HTTP -> A2A
    a2aAgent.grantInvokeAccess(aguiAgent);
    a2aAgent.grantInvokeAccess(httpAgent);

    new LangchainS3Website(this, 'LangchainS3Website');

    // Website -> AGUI: the browser signs requests directly to the AGUI
    // agent's runtime using credentials it exchanges from the Cognito
    // Identity Pool, so the pool's authenticated role needs invoke access.
    aguiAgent.grantInvokeAccess(identity.identityPool.authenticatedRole);
  }
}
