import { Fn, Lazy, Names, Stack } from 'aws-cdk-lib';
import {
  AgentRuntimeArtifact,
  ProtocolType,
  Runtime,
  RuntimeProps,
} from 'aws-cdk-lib/aws-bedrockagentcore';
import { Connections, IConnectable } from 'aws-cdk-lib/aws-ec2';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Grant, IGrantable, IPrincipal } from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from 'path';
import * as url from 'url';
import { RuntimeConfig } from '../../../core/runtime-config.js';
import { findWorkspaceRoot } from '../../../core/workspace.js';

export type StrandsS3McpServerProps = Omit<
  RuntimeProps,
  | 'runtimeName'
  | 'protocolConfiguration'
  | 'agentRuntimeArtifact'
  | 'authorizerConfiguration'
>;

export class StrandsS3McpServer
  extends Construct
  implements IGrantable, IConnectable
{
  public readonly dockerImage: AgentRuntimeArtifact;
  public readonly agentCoreRuntime: Runtime;
  /** Default Gateway target name for this MCP server. */
  public readonly mcpServerName = 'strands-s3-mcp-server';

  constructor(scope: Construct, id: string, props?: StrandsS3McpServerProps) {
    super(scope, id);

    const rc = RuntimeConfig.ensure(this);

    // Resolve the bundle output directory containing the Dockerfile and built artifacts
    const bundleDir = path.join(
      findWorkspaceRoot(url.fileURLToPath(new URL(import.meta.url))),
      'dist/packages/strands_s3_agents/docker/strands-s3-mcp-server',
    );

    this.dockerImage = AgentRuntimeArtifact.fromAsset(bundleDir, {
      platform: Platform.LINUX_ARM64,
    });

    this.agentCoreRuntime = new Runtime(this, 'StrandsS3McpServer', {
      runtimeName: Lazy.string({
        produce: () =>
          Names.uniqueResourceName(this.agentCoreRuntime, { maxLength: 40 }),
      }),
      protocolConfiguration: ProtocolType.MCP,
      agentRuntimeArtifact: this.dockerImage,
      ...props,
      environmentVariables: {
        RUNTIME_CONFIG_APP_ID: rc.appConfigApplicationId,
        ...props?.environmentVariables,
      },
    });

    rc.grantReadAppConfig(this.agentCoreRuntime);

    rc.set('agentcore', 'agentRuntimes', {
      ...rc.get('agentcore').agentRuntimes,
      StrandsS3McpServer: {
        arn: this.agentCoreRuntime.agentRuntimeArn,
      },
    });
  }

  /**
   * The principal to grant permissions to.
   */
  public get grantPrincipal(): IPrincipal {
    return this.agentCoreRuntime.grantPrincipal;
  }

  /**
   * Network connections for this agent runtime.
   */
  public get connections(): Connections {
    return this.agentCoreRuntime.connections;
  }

  /**
   * The MCP endpoint URL of the runtime, e.g. for use as a Gateway target
   * endpoint.
   */
  public get invocationUrl(): string {
    // The URL must URL-encode the runtime ARN (':' -> '%3A', '/' -> '%2F').
    // The ARN is a CDK token, so encode at deploy time via Fn.join/Fn.split.
    const encodedArn = Fn.join(
      '%2F',
      Fn.split(
        '/',
        Fn.join('%3A', Fn.split(':', this.agentCoreRuntime.agentRuntimeArn)),
      ),
    );
    return `https://bedrock-agentcore.${Stack.of(this).region}.amazonaws.com/runtimes/${encodedArn}/invocations?qualifier=DEFAULT`;
  }

  /**
   * Grants IAM permissions to invoke this agent runtime.
   *
   * @param grantee - The IAM principal to grant permissions to
   */
  public grantInvokeAccess(grantee: IGrantable) {
    this.agentCoreRuntime.grantInvoke(grantee);

    Grant.addToPrincipal({
      grantee,
      actions: ['bedrock-agentcore:InvokeAgentRuntimeWithWebSocketStream'],
      resourceArns: [
        this.agentCoreRuntime.agentRuntimeArn,
        `${this.agentCoreRuntime.agentRuntimeArn}/*`,
      ],
    });
  }
}
