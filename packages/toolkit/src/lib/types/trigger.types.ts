import { ConnectionData } from './connection.types';
import { InjectedServices } from './services.types';

export type RunTriggerArgs<ConfigValue, InputData = unknown> = {
  inputData?: InputData;
  configValue: ConfigValue;
  connection?: ConnectionData;
  projectId: string;
  workspaceId: string;
  workflowId?: string;
  testing?: boolean;
  prisma: InjectedServices['prisma'];
  http: InjectedServices['http'];
  fileHandler: InjectedServices['fileHandler'];
  s3: InjectedServices['s3'];
  aiProviders: InjectedServices['aiProviders'];
  task: InjectedServices['task'];
  knowledge: InjectedServices['knowledge'];
  notification: InjectedServices['notification'];
  execution: InjectedServices['execution'];
};
