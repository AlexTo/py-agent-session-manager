import { Fn, Lazy, Names, RemovalPolicy, Stack } from 'aws-cdk-lib';
import { Platform } from 'aws-cdk-lib/aws-ecr-assets';
import { Connections, IConnectable } from 'aws-cdk-lib/aws-ec2';
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
} from 'aws-cdk-lib/aws-s3';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { Construct } from 'constructs';
import * as path from 'path';
import * as url from 'url';
import {
  AgentRuntimeArtifact,
  ProtocolType,
  Runtime,
  RuntimeProps,
} from 'aws-cdk-lib/aws-bedrockagentcore';
import {
  PolicyStatement,
  IGrantable,
  IPrincipal,
  Grant,
} from 'aws-cdk-lib/aws-iam';
import { suppressRules } from '../../../core/checkov.js';
import { RuntimeConfig } from '../../../core/runtime-config.js';
import { findWorkspaceRoot } from '../../../core/workspace.js';

export type LangchainDynamodbA2aAgentProps = Omit<
  RuntimeProps,
  | 'runtimeName'
  | 'protocolConfiguration'
  | 'agentRuntimeArtifact'
  | 'authorizerConfiguration'
>;

export class LangchainDynamodbA2aAgent
  extends Construct
  implements IGrantable, IConnectable
{
  public readonly dockerImage: AgentRuntimeArtifact;
  public readonly agentCoreRuntime: Runtime;
  /** Default Gateway target name for this agent. */
  public readonly agentName = 'langchain-dynamodb-a2a-agent';
  /** Inbound auth — a fronting Gateway uses this to pick its outbound credential. */
  public readonly auth = 'iam';

  constructor(
    scope: Construct,
    id: string,
    props?: LangchainDynamodbA2aAgentProps,
  ) {
    super(scope, id);

    const rc = RuntimeConfig.ensure(this);

    // Resolve the bundle output directory containing the Dockerfile and built artifacts
    const bundleDir = path.join(
      findWorkspaceRoot(url.fileURLToPath(new URL(import.meta.url))),
      'dist/packages/langchain_dynamodb_agents/docker/langchain-dynamodb-a2a-agent',
    );

    this.dockerImage = AgentRuntimeArtifact.fromAsset(bundleDir, {
      platform: Platform.LINUX_ARM64,
    });

    const sessionBucket = new Bucket(this, 'SessionBucket', {
      enforceSSL: true,
      // Dev-friendly: destroy (and empty) the bucket on stack teardown instead
      // of retaining session data indefinitely, and skip a dedicated KMS key
      // in favour of S3-managed encryption.
      removalPolicy: RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      encryption: BucketEncryption.S3_MANAGED,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });
    suppressRules(
      sessionBucket,
      ['CKV_AWS_21'],
      'Session data does not need versioning enabled',
    );
    suppressRules(
      sessionBucket,
      ['CKV2_AWS_61'],
      'Lifecycle configuration not required for session data',
    );
    suppressRules(
      sessionBucket,
      ['CKV_AWS_144'],
      'Cross-region replication not required for session data',
    );
    suppressRules(
      sessionBucket,
      ['CKV2_AWS_62'],
      'Event notifications not required for session data',
    );
    suppressRules(
      sessionBucket,
      ['CKV_AWS_18'],
      'Access logging not required for dev session data',
    );

    // Unified checkpoints/writes table, matching the schema
    // langgraph_checkpoint_aws.DynamoDBSaver expects (PK/SK, TTL on `ttl`).
    // Dev-friendly: AWS-owned encryption (no dedicated KMS key), no
    // point-in-time recovery, deletion protection off, destroyed with the
    // stack instead of retained.
    const sessionTable = new Table(this, 'SessionTable', {
      partitionKey: { name: 'PK', type: AttributeType.STRING },
      sortKey: { name: 'SK', type: AttributeType.STRING },
      billingMode: BillingMode.PAY_PER_REQUEST,
      timeToLiveAttribute: 'ttl',
      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY,
    });
    suppressRules(
      sessionTable,
      ['CKV_AWS_119'],
      'Customer-managed KMS key not required for dev session data',
    );
    suppressRules(
      sessionTable,
      ['CKV_AWS_28'],
      'Point-in-time recovery not required for dev session data',
    );

    this.agentCoreRuntime = new Runtime(this, 'LangchainDynamodbA2aAgent', {
      runtimeName: Lazy.string({
        produce: () =>
          Names.uniqueResourceName(this.agentCoreRuntime, { maxLength: 40 }),
      }),
      protocolConfiguration: ProtocolType.A2A,
      agentRuntimeArtifact: this.dockerImage,
      ...props,
      environmentVariables: {
        RUNTIME_CONFIG_APP_ID: rc.appConfigApplicationId,
        ...props?.environmentVariables,
      },
    });

    // Grant access for the agent to invoke bedrock models
    this.agentCoreRuntime.addToRolePolicy(
      new PolicyStatement({
        actions: [
          'bedrock:InvokeModel',
          'bedrock:InvokeModelWithResponseStream',
        ],
        resources: [
          'arn:aws:bedrock:*:*:foundation-model/*',
          'arn:aws:bedrock:*:*:inference-profile/*',
        ],
      }),
    );

    sessionTable.grantReadWriteData(this.agentCoreRuntime);
    sessionBucket.grantReadWrite(this.agentCoreRuntime);

    rc.grantReadAppConfig(this.agentCoreRuntime);

    rc.set('agentcore', 'agentRuntimes', {
      ...rc.get('agentcore').agentRuntimes,
      LangchainDynamodbA2aAgent: {
        arn: this.agentCoreRuntime.agentRuntimeArn,
        session: {
          tableName: sessionTable.tableName,
          bucketName: sessionBucket.bucketName,
        },
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
   * The A2A endpoint URL of the runtime (the trailing slash is required).
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
    return `https://bedrock-agentcore.${Stack.of(this).region}.amazonaws.com/runtimes/${encodedArn}/invocations/`;
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
      actions: [
        'bedrock-agentcore:InvokeAgentRuntimeWithWebSocketStream',
        'bedrock-agentcore:GetAgentCard',
      ],
      resourceArns: [
        this.agentCoreRuntime.agentRuntimeArn,
        `${this.agentCoreRuntime.agentRuntimeArn}/*`,
      ],
    });
  }
}
