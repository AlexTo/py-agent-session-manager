import {
  LangchainDynamodbA2aAgent,
  LangchainDynamodbAguiAgent,
  LangchainDynamodbHttpAgent,
  LangchainDynamodbMcpServer,
  LangchainDynamodbWebsite,
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

    const mcpServer = new LangchainDynamodbMcpServer(
      this,
      'LangchainDynamodbMcpServer',
    );
    const httpAgent = new LangchainDynamodbHttpAgent(
      this,
      'LangchainDynamodbHttpAgent',
    );
    const a2aAgent = new LangchainDynamodbA2aAgent(
      this,
      'LangchainDynamodbA2aAgent',
    );
    const aguiAgent = new LangchainDynamodbAguiAgent(
      this,
      'LangchainDynamodbAguiAgent',
    );

    // Agents -> MCP
    mcpServer.grantInvokeAccess(httpAgent);
    mcpServer.grantInvokeAccess(a2aAgent);
    mcpServer.grantInvokeAccess(aguiAgent);

    // AGUI -> A2A / HTTP -> A2A
    a2aAgent.grantInvokeAccess(aguiAgent);
    a2aAgent.grantInvokeAccess(httpAgent);

    new LangchainDynamodbWebsite(this, 'LangchainDynamodbWebsite');

    // Website -> AGUI: the browser signs requests directly to the AGUI
    // agent's runtime using credentials it exchanges from the Cognito
    // Identity Pool, so the pool's authenticated role needs invoke access.
    aguiAgent.grantInvokeAccess(identity.identityPool.authenticatedRole);
  }
}
