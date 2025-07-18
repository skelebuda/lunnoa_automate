import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Cron } from '@nestjs/schedule';
import { WorkflowStrategy } from '@prisma/client';
import { JsonValue } from '@prisma/client/runtime/library';

import { ServerConfig } from '../../../config/server.config';
import { PrismaService } from '../../global/prisma/prisma.service';
import { S3ManagerService } from '../../global/s3/s3.service';
import { WorkflowAppsService } from '../workflow-apps/workflow-apps.service';
import {
  ExecutionNodeForRunner,
  ImmediatelyRunExecutionPayload,
  WorkflowNodeForRunner,
} from '../workflow-runner/workflow-runner.service';

@Injectable()
export class PollerService {
  constructor(
    private prisma: PrismaService,
    private workflowAppService: WorkflowAppsService,
    private eventEmitter: EventEmitter2,
    private s3: S3ManagerService,
  ) {}

  //Every 15 minute
  @Cron('0,15,30,45 * * * *')
  async workflowTriggerPollerBusinessTier() {
      // Get all workflows with poll strategy
      const workflows = await this.#getWorkflowsByStrategyAndPaymentPlan({
        strategy: 'poll',
      });

      await this.#checkPollerWorkflowsForExecution({ workflows });
    
  }

  //Every 15 minutes
  @Cron('0,15,30,45 * * * *')
  async workflowTriggerPollerTeamTier() {
      // Get all workflows with poll strategy
      const workflows = await this.#getWorkflowsByStrategyAndPaymentPlan({
        strategy: 'poll',
      });
      await this.#checkPollerWorkflowsForExecution({ workflows });
  }

  //Every 15 minutes
  @Cron('0,15,30,45 * * * *')
  async workflowTriggerPollerProfessionalTier() {
      // Get all workflows with poll strategy
      const workflows = await this.#getWorkflowsByStrategyAndPaymentPlan({
        strategy: 'poll',
      }
    );
      await this.#checkPollerWorkflowsForExecution({ workflows });
  }

  //Every hour
  @Cron('0 * * * *')
  async workflowTriggerPollerFreeTier() {
      // Get all workflows with poll strategy
      const workflows = await this.#getWorkflowsByStrategyAndPaymentPlan({
        strategy: 'poll',
      });
      await this.#checkPollerWorkflowsForExecution({ workflows });
  }

  //Every 10 seconds or whatever is set in ServerConfig
  @Cron(ServerConfig.CRON_TRIGGER_POLLING_INTERVAL || '*/5 * * * *')
  async workflowTriggerForNoBillingPlatform() {
      const workflows = await this.#getWorkflowsByStrategyAndPaymentPlan({
        strategy: 'poll',
      });
      await this.#checkPollerWorkflowsForExecution({ workflows });
  }

  //Every minute
  @Cron('0 */1 * * * *')
  async pollerScheduledWorkflows() {
    // Get all workflows with upcoming scheduled executions
    const workflows = await this.#getUpcomingScheduledWorkflows();

    await this.#checkScheduledTriggersForExecution({ workflows });
  }

  //Every minute
  @Cron('0 */1 * * * *')
  async pollerScheduledExecutions() {
    // Get all executions with continueExecutionAt value in the past
    await this.#runScheduledExecutions();
  }

  //Every 24 hours
  @Cron('0 0 * * *')
  async deleteExecutionHistory() {
    const workspaces = await this.prisma.workspace.findMany({
      select: {
        id: true,
      },
    });

    workspaces.forEach(async (workspace) => {

      let retentionPeriodDays = 3650;
      
      const date = new Date();
      date.setDate(date.getDate() - retentionPeriodDays);

      await this.prisma.execution.deleteMany({
        where: {
          AND: [
            {
              workflow: {
                project: {
                  FK_workspaceId: workspace.id,
                },
              },
            },
            {
              createdAt: {
                lte: date,
              },
            },
          ],
        },
      });
    });
  }

  //Every 24 hours
  @Cron('0 0 * * *')
  async deleteAgentTaskHistory() {
    const workspaces = await this.prisma.workspace.findMany({
      select: {
        id: true,
      },
    });

    workspaces.forEach(async (workspace) => {
      let retentionPeriodDays = 3650;
      
      const date = new Date();
      date.setDate(date.getDate() - retentionPeriodDays);

        await this.prisma.taskMessage.deleteMany({
          where: {
            AND: [
              {
                task: {
                  agent: {
                    project: {
                      FK_workspaceId: workspace.id,
                    },
                  },
                },
              },
              {
                createdAt: {
                  lte: date,
                },
              },
            ],
          },
        });

        //Delete all tasks with no messages
        await this.prisma.task.deleteMany({
          where: {
            AND: [
              {
                agent: {
                  project: {
                    FK_workspaceId: workspace.id,
                  },
                },
              },
              {
                messages: {
                  none: {},
                },
              },
            ],
          },
        });
    });
  }

  //Every 24 hours
  @Cron('0 0 * * *')
  async deleteOldNotifications() {
    //Delete notifications older than 14 days
    const date = new Date();
    date.setDate(date.getDate() - 14);

    await this.prisma.notification.deleteMany({
      where: {
        AND: [
          {
            createdAt: {
              lte: date,
            },
          },
        ],
      },
    });
  }

  
  //Every hour
  @Cron('0 * * * *')
  async deleteTempS3Files() {
    /**
     * All file links generated are added to the temp folder in the S3 bucket.
     * This method recursively deletes all files older than 24 hours.
     */

    if (ServerConfig.S3_ACCESS_KEY_ID) {
      await this.s3.deleteTempFiles('temp');
    }
  }



  #checkPollerWorkflowsForExecution = async ({
    workflows,
  }: {
    workflows: WorkflowForTrigger[];
  }) => {
    await Promise.allSettled(
      workflows.map(async (workflow) => {
        // For each workflow, get the trigger nodes
        const triggerNode = workflow.triggerNode as WorkflowNodeForRunner;

        //There should always be one
        if (triggerNode) {
          const trigger = this.workflowAppService.getTriggerFromNode({
            node: triggerNode,
          });

          await trigger.runExecutionCheckForPollingWorkflows({
            triggerNode,
            workflowId: workflow.id,
            projectId: workflow.project.id,
            workspaceId: workflow.project.FK_workspaceId,
          });
        }
      }),
    );
  };

  #checkScheduledTriggersForExecution = async ({
    workflows,
  }: {
    workflows: WorkflowForTrigger[];
  }) => {
    await Promise.allSettled(
      workflows.map(async (workflow) => {
        // For each workflow, get the trigger nodes
        const triggerNode = workflow.triggerNode as WorkflowNodeForRunner;

        //There should always be one
        if (triggerNode) {
          const trigger = this.workflowAppService.getTriggerFromNode({
            node: triggerNode,
          });

          await trigger.runExecutionCheckForScheduledWorkflows({
            triggerNode,
            workflowId: workflow.id,
            projectId: workflow.project.id,
            workspaceId: workflow.project.FK_workspaceId,
          });
        }
      }),
    );
  };

  async #getWorkflowsByStrategyAndPaymentPlan({
    strategy,
  }: {
    strategy: WorkflowStrategy;
  }) {
    const workspaces = await this.prisma.workspace.findMany({
      where: {},
      select: {
        projects: {
          select: {
            workflows: {
              where: {
                AND: [
                  {
                    isActive: true,
                  },
                  {
                    strategy: strategy,
                  },
                ],
              },
              select: {
                id: true,
                triggerNode: true,
                project: {
                  select: {
                    id: true,
                    FK_workspaceId: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    return workspaces
      .map((workspace) => workspace.projects)
      .flat()
      .map((project) => project.workflows)
      .flat();
  }

  async #getUpcomingScheduledWorkflows() {
    const workspacesWithWorkflows = await this.prisma.project.findMany({
      select: {
        workflows: {
          where: {
            AND: [
              {
                isActive: true,
              },
              {
                //Need this because we're not clearing the nextScheduledExecution because I'm lazy
                strategy: 'schedule',
              },
              {
                //Get where next shceduled execution is less than or equal to now
                nextScheduledExecution: {
                  lte: new Date(),
                },
              },
            ],
          },
          select: {
            id: true,
            triggerNode: true,
            project: {
              select: {
                id: true,
                FK_workspaceId: true,
              },
            },
          },
        },
      },
    });

    return workspacesWithWorkflows.map((project) => project.workflows).flat();
  }

  async #runScheduledExecutions() {
    /**
     * Scheduled executions aren't expecting any input data.
     * So all we need to do to allow the execution to continue is to
     * update the scheduled node to be status "SUCCESS" and to emit the workspaceExecution.immediatelyRun.
     * Since we can, we'll also add the ranAt value to the node output
     */

    const executions = await this.prisma.execution.findMany({
      select: {
        id: true,
        nodes: true,
      },
      where: {
        AND: [
          // {
          //Cant rely on status, because other things can change the status to NEEDS_INPUT or RUNNINg.
          //status is mostly to help the UI know what's going on.
          //   status: 'SCHEDULED',
          // },
          {
            status: {
              not: 'SUCCESS',
            },
          },
          {
            continueExecutionAt: {
              lte: new Date(),
            },
          },
        ],
      },
    });

    await Promise.all(
      executions.map(async (execution) => {
        //0. Create a variable for all the nodes we want to run from
        const continueFromTheseNodeIds: string[] = [];

        //1. Grab all the nodes that have a scheduledAt output
        const updatedNodes = (execution.nodes as ExecutionNodeForRunner[]).map(
          (node: ExecutionNodeForRunner) => {
            try {
              if (
                node.output?.scheduledAt &&
                node.executionStatus === 'SCHEDULED' &&
                new Date(node.output.scheduledAt) <= new Date()
              ) {
                //If the node is scheduled
                //If the node still hasn't ran (is still scheduled)
                //And if it's scheduledAt is in the past, then we'll mark it as success
                //so the execution can continue from that point.
                continueFromTheseNodeIds.push(node.id);

                return {
                  ...node,
                  executionStatus: 'SUCCESS',
                  output: { ...node.output, ranAt: new Date().toISOString() },
                };
              } else {
                return node;
              }
            } catch (err) {
              //Catching incase scheduledAt isn't a valid date. We're validating it in the actions, but
              //this is incase I missed something, we can log it.
              console.error(err);
              return node;
            }
          },
        );

        //2. Update the execution with the new nodes
        await this.prisma.execution.update({
          where: {
            id: execution.id,
          },
          data: {
            nodes: updatedNodes,
          },
          select: {
            id: true,
          },
        });

        // 3. Trigger the execution to continue
        const emitPayload: ImmediatelyRunExecutionPayload = {
          executionId: execution.id,
          inputData: undefined,
          continueFromTheseNodeIds,
        };

        this.eventEmitter.emit(
          'workspaceExecution.immediatelyRun',
          emitPayload,
        );
      }),
    );
  }
}

type WorkflowForTrigger = {
  id: string;
  triggerNode: JsonValue;
  project: {
    id: string;
    FK_workspaceId: string;
  };
};
