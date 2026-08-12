import {
  CfnOutput,
  CfnResource,
  Duration,
  Lazy,
  RemovalPolicy,
  Stack,
} from 'aws-cdk-lib';
import {
  Distribution,
  HeadersFrameOption,
  HeadersReferrerPolicy,
  ResponseHeadersPolicy,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from 'aws-cdk-lib/aws-cloudfront';
import { ICertificate } from 'aws-cdk-lib/aws-certificatemanager';
import { S3BucketOrigin } from 'aws-cdk-lib/aws-cloudfront-origins';
import {
  BlockPublicAccess,
  Bucket,
  BucketEncryption,
  IBucket,
  ObjectOwnership,
} from 'aws-cdk-lib/aws-s3';
import {
  BucketDeployment,
  CacheControl,
  Source,
} from 'aws-cdk-lib/aws-s3-deployment';
import { Construct } from 'constructs';
import { RuntimeConfig } from './runtime-config.js';
import { suppressRules } from './checkov.js';

const DEFAULT_RUNTIME_CONFIG_FILENAME = 'runtime-config.json';

// Content-Security-Policy enforced on all responses. Restricts scripts and
// framing to mitigate XSS and clickjacking, while permitting HTTPS/WSS calls
// (connect-src) to AWS service endpoints such as API Gateway, Cognito and
// Bedrock AgentCore which are only known at deploy time. Edit this to tighten
// connect-src to your specific origins once they are known.
const CONTENT_SECURITY_POLICY = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data:",
  "font-src 'self' data:",
  "connect-src 'self' https: wss:",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join('; ');

export interface StaticWebsiteProps {
  readonly websiteName: string;
  readonly websiteFilePath: string;
  /**
   * Custom domain names for the CloudFront distribution. Requires `certificate`.
   */
  readonly domainNames?: string[];
  /**
   * ACM certificate for the custom domain names. Must be in us-east-1.
   * When provided, viewers are required to use TLS 1.2 or later.
   */
  readonly certificate?: ICertificate;
}

/**
 * Deploys a Static Website using by default a private S3 bucket as an origin and Cloudfront as the entrypoint.
 */
export class StaticWebsite extends Construct {
  public readonly websiteBucket: IBucket;
  public readonly cloudFrontDistribution: Distribution;
  public readonly bucketDeployment: BucketDeployment;

  constructor(
    scope: Construct,
    id: string,
    {
      websiteFilePath,
      websiteName,
      domainNames,
      certificate,
    }: StaticWebsiteProps,
  ) {
    super(scope, id);

    // S3 Bucket to hold website files
    this.websiteBucket = new Bucket(this, 'WebsiteBucket', {
      enforceSSL: true,
      autoDeleteObjects: true,
      removalPolicy: RemovalPolicy.DESTROY,
      encryption: BucketEncryption.S3_MANAGED,
      objectOwnership: ObjectOwnership.BUCKET_OWNER_ENFORCED,
      publicReadAccess: false,
      blockPublicAccess: BlockPublicAccess.BLOCK_ALL,
    });
    suppressRules(
      this.websiteBucket,
      ['CKV_AWS_18'],
      'Access logging not required for dev website assets',
    );
    suppressRules(
      this.websiteBucket,
      ['CKV_AWS_21'],
      'Website assets do not need versioning enabled',
    );
    // Security headers applied to all responses.
    const responseHeadersPolicy = new ResponseHeadersPolicy(
      this,
      'ResponseHeadersPolicy',
      {
        securityHeadersBehavior: {
          strictTransportSecurity: {
            accessControlMaxAge: Duration.days(730),
            includeSubdomains: true,
            preload: true,
            override: true,
          },
          contentTypeOptions: { override: true },
          frameOptions: {
            frameOption: HeadersFrameOption.DENY,
            override: true,
          },
          referrerPolicy: {
            referrerPolicy:
              HeadersReferrerPolicy.STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
            override: true,
          },
          contentSecurityPolicy: {
            contentSecurityPolicy: CONTENT_SECURITY_POLICY,
            override: true,
          },
        },
      },
    );

    const defaultRootObject = 'index.html';
    this.cloudFrontDistribution = new Distribution(
      this,
      'CloudfrontDistribution',
      {
        ...(certificate
          ? {
              certificate,
              domainNames,
              minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
            }
          : {}),
        defaultBehavior: {
          origin: S3BucketOrigin.withOriginAccessControl(this.websiteBucket),
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          responseHeadersPolicy,
        },
        defaultRootObject,
        errorResponses: [
          {
            httpStatus: 404, // We need to redirect "key not found errors" to index.html for single page apps
            responseHttpStatus: 200,
            responsePagePath: `/${defaultRootObject}`,
          },
          {
            httpStatus: 403, // We need to redirect reloads from paths (e.g. /foo/bar) to index.html for single page apps
            responseHttpStatus: 200,
            responsePagePath: `/${defaultRootObject}`,
          },
        ],
      },
    );
    if (!certificate) {
      // See https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesGeneral.html
      suppressRules(
        this.cloudFrontDistribution,
        ['CKV_AWS_174'],
        'Cloudfront default certificate does not use TLS 1.2',
      );
    }
    suppressRules(
      this.cloudFrontDistribution,
      ['CKV_AWS_86'],
      'Access logging not required for dev website assets',
    );
    suppressRules(
      this.cloudFrontDistribution,
      ['CKV_AWS_68'],
      'WAF not required for dev website assets',
    );

    // Deploy Website
    this.bucketDeployment = new BucketDeployment(this, 'WebsiteDeployment', {
      sources: [Source.asset(websiteFilePath)],
      destinationBucket: this.websiteBucket,
      // Files in the distribution's edge caches will be invalidated after files are uploaded to the destination bucket.
      distribution: this.cloudFrontDistribution,
      // Exclude the runtime config from this deployment's sync so its default pruning
      // never deletes the file managed separately by RuntimeConfigDeployment below.
      exclude: [DEFAULT_RUNTIME_CONFIG_FILENAME],
      memoryLimit: 1024,
    });

    // Deploy runtime-config.json separately so it is never cached - clients
    // must always fetch the latest configuration.
    new BucketDeployment(this, 'RuntimeConfigDeployment', {
      sources: [
        Source.data(
          DEFAULT_RUNTIME_CONFIG_FILENAME,
          Lazy.string({
            produce: () =>
              Stack.of(this).toJsonString(
                RuntimeConfig.ensure(this).get('connection'),
              ),
          }),
        ),
      ],
      destinationBucket: this.websiteBucket,
      distribution: this.cloudFrontDistribution,
      cacheControl: [CacheControl.noCache()],
      prune: false,
      memoryLimit: 1024,
    });

    suppressRules(
      Stack.of(this),
      ['CKV_AWS_111'],
      'CDK Bucket Deployment uses wildcard to deploy arbitrary assets',
      (c) =>
        CfnResource.isCfnResource(c) &&
        c.cfnResourceType === 'AWS::IAM::Policy' &&
        c.node.path.includes(`/Custom::CDKBucketDeployment`),
    );

    new CfnOutput(this, 'DistributionDomainName', {
      value: this.cloudFrontDistribution.domainName,
    });
    new CfnOutput(this, `${websiteName}WebsiteBucketName`, {
      value: this.websiteBucket.bucketName,
    });
  }
}
