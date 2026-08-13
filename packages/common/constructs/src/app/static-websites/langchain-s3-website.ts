import { Construct } from 'constructs';
import * as url from 'url';
import { StaticWebsite } from '../../core/index.js';

export class LangchainS3Website extends StaticWebsite {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      websiteName: 'LangchainS3Website',
      websiteFilePath: url.fileURLToPath(
        new URL(
          '../../../../../../dist/packages/langchain-s3-website/bundle',
          import.meta.url,
        ),
      ),
    });
  }
}
