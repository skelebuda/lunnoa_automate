import { ConnectionType } from '../../types/connection.types';
import { InputConfig } from '../../types/input-config.types';

export function createDatabaseConnection(args: CreateDatabaseConnectionArgs) {
  return {
    ...args,
    connectionType: 'database' as ConnectionType,
  };
}

export type CreateDatabaseConnectionArgs = {
  id: string;
  name: string;
  description: string;
  inputConfig?: InputConfig;
};