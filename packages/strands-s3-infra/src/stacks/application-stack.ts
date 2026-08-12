import { Stack, StackProps } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {
  StrandsS3A2aAgent,
  StrandsS3AguiAgent,
  StrandsS3HttpAgent,
  StrandsS3McpServer,
  StrandsS3Website,
  UserIdentity,
} from '@my-py-agents/common-constructs';

export class ApplicationStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    // Shared Cognito user/identity pool backing the website's login and the
    // AGUI agent's browser-side SigV4 credentials.
    // Dev-friendly: skip MFA for this sandbox deployment.
    const identity = new UserIdentity(this, 'Identity', {
      requireMfa: false,
    });

    const mcpServer = new StrandsS3McpServer(this, 'StrandsS3McpServer');
    const httpAgent = new StrandsS3HttpAgent(this, 'StrandsS3HttpAgent');
    const a2aAgent = new StrandsS3A2aAgent(this, 'StrandsS3A2aAgent');
    const aguiAgent = new StrandsS3AguiAgent(this, 'StrandsS3AguiAgent');

    // Agents -> MCP
    mcpServer.grantInvokeAccess(httpAgent);
    mcpServer.grantInvokeAccess(a2aAgent);
    mcpServer.grantInvokeAccess(aguiAgent);

    // AGUI -> A2A / HTTP -> A2A
    a2aAgent.grantInvokeAccess(aguiAgent);
    a2aAgent.grantInvokeAccess(httpAgent);

    new StrandsS3Website(this, 'StrandsS3Website');

    // Website -> AGUI: the browser signs requests directly to the AGUI
    // agent's runtime using credentials it exchanges from the Cognito
    // Identity Pool, so the pool's authenticated role needs invoke access.
    aguiAgent.grantInvokeAccess(identity.identityPool.authenticatedRole);
  }
}
