import * as url from 'url';
import { Construct } from 'constructs';
import { StaticWebsite } from '../../core/index.js';

export class LangchainDynamodbWebsite extends StaticWebsite {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      websiteName: 'LangchainDynamodbWebsite',
      websiteFilePath: url.fileURLToPath(
        new URL(
          '../../../../../../dist/packages/langchain-dynamodb-website/bundle',
          import.meta.url,
        ),
      ),
    });
  }
}
