import {
  CfnOutput,
  CfnResource,
  Duration,
  Lazy,
  RemovalPolicy,
  Stack,
} from 'aws-cdk-lib';
import { Distribution } from 'aws-cdk-lib/aws-cloudfront';
import {
  AccountRecovery,
  CfnManagedLoginBranding,
  FeaturePlan,
  ManagedLoginVersion,
  Mfa,
  OAuthScope,
  StandardThreatProtectionMode,
  UserPool,
  UserPoolClient,
  UserPoolDomain,
} from 'aws-cdk-lib/aws-cognito';
import {
  IdentityPool,
  UserPoolAuthenticationProvider,
} from 'aws-cdk-lib/aws-cognito-identitypool';
import { Construct } from 'constructs';
import { suppressRules } from './checkov.js';
import { findCloudFrontDomainNames } from './cloudfront.js';
import { RuntimeConfig } from './runtime-config.js';

const WEB_CLIENT_ID = 'WebClient';

/** Local dev server origins permitted to complete the sign-in redirect */
const LOCAL_CALLBACK_URLS = ['http://localhost:4200', 'http://localhost:4300'];

export interface UserIdentityProps {
  /**
   * Whether to require MFA at sign-in.
   *
   * @default true
   */
  readonly requireMfa?: boolean;
}

/**
 * Creates a UserPool and Identity Pool with sane defaults configured intended for usage from a web client.
 */
export class UserIdentity extends Construct {
  public readonly region: string;
  public readonly identityPool: IdentityPool;
  public readonly userPool: UserPool;
  public readonly userPoolClient: UserPoolClient;
  public readonly userPoolDomain: UserPoolDomain;

  constructor(
    scope: Construct,
    id: string,
    { requireMfa = true }: UserIdentityProps = {},
  ) {
    super(scope, id);

    this.region = Stack.of(this).region;
    this.userPool = this.createUserPool(requireMfa);
    this.userPoolDomain = this.createUserPoolDomain(this.userPool);
    this.userPoolClient = this.createUserPoolClient(this.userPool);
    this.identityPool = this.createIdentityPool(
      this.userPool,
      this.userPoolClient,
    );
    this.createManagedLoginBranding(
      this.userPool,
      this.userPoolClient,
      this.userPoolDomain,
    );

    RuntimeConfig.ensure(this).set('connection', 'cognitoProps', {
      region: Stack.of(this).region,
      identityPoolId: this.identityPool.identityPoolId,
      userPoolId: this.userPool.userPoolId,
      userPoolWebClientId: this.userPoolClient.userPoolClientId,
    });

    suppressRules(
      this.userPool,
      ['CKV_AWS_111'],
      'SMS Role requires wildcard resource',
      (c) => c.node.path.includes('/smsRole/'),
    );

    new CfnOutput(this, `${id}-UserPoolId`, {
      value: this.userPool.userPoolId,
    });

    new CfnOutput(this, `${id}-UserPoolClientId`, {
      value: this.userPoolClient.userPoolClientId,
    });

    new CfnOutput(this, `${id}-IdentityPoolId`, {
      value: this.identityPool.identityPoolId,
    });
  }

  private createUserPool = (requireMfa: boolean) => {
    const userPool = new UserPool(this, 'UserPool', {
      // Dev-friendly: allow the pool to be deleted along with the sandbox stack.
      deletionProtection: false,
      removalPolicy: RemovalPolicy.DESTROY,
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
        tempPasswordValidity: Duration.days(3),
      },
      mfa: requireMfa ? Mfa.REQUIRED : Mfa.OFF,
      ...(requireMfa ? { mfaSecondFactor: { sms: true, otp: true } } : {}),
      featurePlan: FeaturePlan.PLUS,
      // Audit-only logs threat assessments without blocking sign-in. Switch to FULL_FUNCTION to enforce automatic responses.
      standardThreatProtectionMode: StandardThreatProtectionMode.AUDIT_ONLY,
      signInCaseSensitive: false,
      signInAliases: { username: true, email: true },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      selfSignUpEnabled: true,
      standardAttributes: {
        phoneNumber: { required: false },
        email: { required: true },
        givenName: { required: true },
        familyName: { required: true },
      },
      autoVerify: {
        email: true,
        phone: true,
      },
      keepOriginal: {
        email: true,
        phone: true,
      },
    });
    // Retain the SMS role alongside the pool so the pool can still be updated and deleted manually
    const poolCfn = userPool.node.defaultChild as CfnResource;
    const smsRoleNode = userPool.node.tryFindChild('smsRole');
    if (smsRoleNode) {
      const smsRoleCfn = smsRoleNode.node.defaultChild as CfnResource;
      smsRoleCfn.cfnOptions.deletionPolicy = poolCfn.cfnOptions.deletionPolicy;
      smsRoleCfn.cfnOptions.updateReplacePolicy =
        poolCfn.cfnOptions.updateReplacePolicy;
    }
    return userPool;
  };

  private createUserPoolDomain = (userPool: UserPool) =>
    new UserPoolDomain(this, 'UserPoolDomain', {
      userPool,
      cognitoDomain: {
        domainPrefix: `ts-session-manager-${Stack.of(this).account}`,
      },
      managedLoginVersion: ManagedLoginVersion.NEWER_MANAGED_LOGIN,
    });

  private createUserPoolClient = (userPool: UserPool) => {
    const lazilyComputedCallbackUrls = Lazy.list({
      produce: () =>
        LOCAL_CALLBACK_URLS.concat(
          Stack.of(this)
            .node.findAll()
            .filter(
              (child): child is Distribution => child instanceof Distribution,
            )
            .flatMap(findCloudFrontDomainNames)
            .map((domain) => `https://${domain}`),
        ),
    });

    return userPool.addClient(WEB_CLIENT_ID, {
      authFlows: {
        userPassword: true,
        userSrp: true,
        user: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [OAuthScope.EMAIL, OAuthScope.OPENID, OAuthScope.PROFILE],
        callbackUrls: lazilyComputedCallbackUrls,
        logoutUrls: lazilyComputedCallbackUrls,
      },
      preventUserExistenceErrors: true,
    });
  };

  private createIdentityPool = (
    userPool: UserPool,
    userPoolClient: UserPoolClient,
  ) => {
    const identityPool = new IdentityPool(this, 'IdentityPool');

    identityPool.addUserPoolAuthentication(
      new UserPoolAuthenticationProvider({
        userPool,
        userPoolClient,
      }),
    );

    return identityPool;
  };

  private createManagedLoginBranding = (
    userPool: UserPool,
    userPoolClient: UserPoolClient,
    userPoolDomain: UserPoolDomain,
  ) => {
    new CfnManagedLoginBranding(this, 'ManagedLoginBranding', {
      userPoolId: userPool.userPoolId,
      clientId: userPoolClient.userPoolClientId,
      useCognitoProvidedValues: true,
    }).node.addDependency(userPoolClient, userPool, userPoolDomain);
  };
}
