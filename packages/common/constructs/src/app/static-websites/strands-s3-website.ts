import { Construct } from 'constructs';
import * as url from 'url';
import { StaticWebsite } from '../../core/index.js';

export class StrandsS3Website extends StaticWebsite {
  constructor(scope: Construct, id: string) {
    super(scope, id, {
      websiteName: 'StrandsS3Website',
      websiteFilePath: url.fileURLToPath(
        new URL(
          '../../../../../../dist/packages/strands-s3-website/bundle',
          import.meta.url,
        ),
      ),
    });
  }
}
