import { Global, Module } from '@nestjs/common';

import { GCPStorageService } from './gcp_storage.service';

@Global()
@Module({
  imports: [],
  providers: [GCPStorageService],
  exports: [GCPStorageService],
})
export class GCPStorageManagerModule {}
