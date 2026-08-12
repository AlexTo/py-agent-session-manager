// Resolves the deployed StrandsS3HttpAgent agent from runtime config and authenticates requests to it.
import { randomUUID } from 'node:crypto';
import { getAppConfig } from '@aws-lambda-powertools/parameters/appconfig';
import { fromNodeProviderChain } from '@aws-sdk/credential-providers';
import { AwsClient } from 'aws4fetch';

const SESSION_HEADER = 'X-Amzn-Bedrock-AgentCore-Runtime-Session-Id';

// AgentCore session ids must be at least 33 characters.
export const SESSION_ID = randomUUID().replaceAll('-', '').padEnd(33, '0');

export interface RemoteAgent {
  /** ARN of the deployed Bedrock AgentCore runtime. */
  arn: string;
  /** AWS region parsed from the runtime ARN. */
  region: string;
}

// Returns the deployed agent when `RUNTIME_CONFIG_APP_ID` is set, otherwise `undefined` to chat locally.
export const resolveRemoteAgent = async (): Promise<
  RemoteAgent | undefined
> => {
  const application = process.env.RUNTIME_CONFIG_APP_ID;
  if (!application) {
    return undefined;
  }
  const config = (await getAppConfig('agentcore', {
    application,
    environment: 'default',
    transform: 'json',
  })) as { agentRuntimes?: Record<string, { arn: string }> };
  const arn = config?.agentRuntimes?.['StrandsS3HttpAgent']?.arn;
  if (!arn) {
    throw new Error(
      `No deployed agent named 'StrandsS3HttpAgent' found in runtime configuration (application ${application}).`,
    );
  }
  return { arn, region: arn.split(':')[3] };
};

// A `fetch` that authenticates requests to the deployed agent and forwards the session id.
export const createAgentCoreFetch = (region: string): typeof fetch => {
  const credentialProvider = fromNodeProviderChain();
  return async (input, init) => {
    const headers = new Headers(init?.headers);
    headers.set(SESSION_HEADER, SESSION_ID);
    const client = new AwsClient({
      ...(await credentialProvider()),
      service: 'bedrock-agentcore',
      region,
    });
    return client.fetch(input, { ...init, headers });
  };
};
