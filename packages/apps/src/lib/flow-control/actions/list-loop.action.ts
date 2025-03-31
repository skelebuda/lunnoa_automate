import { createAction, createDynamicSelectInputField, createJsonInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const listLoop = createAction({
  id: 'flow-control_action_list-loop',
  name: 'List Loop',
  description: 'Loop through a list and run a workflow for each item.',
  iconUrl: `https://lecca-io.s3.us-east-2.amazonaws.com/assets/actions/flow-control_action_list-loop.svg`,
  viewOptions: {
    saveButtonOptions: {
      replaceSaveAndTestButton: {
        label: 'Save',
        type: 'mock',
      },
      hideSaveButton: true,
    },
  },
  inputConfig: [
    createJsonInputField({
      id: 'list',
      label: 'List to Loop Through',
      description: 'The list of items to iterate through. Must be a valid JSON array.',
      required: {
        missingMessage: 'List is required',
        missingStatus: 'warning',
      },
    }),
    createDynamicSelectInputField({
      id: 'workflowId',
      label: 'Workflow to Run for Each Item',
      description: 'Only manual and scheduled workflows can be triggered by a workflow.',
      placeholder: 'Select a workflow',
      hideCustomTab: true,
      _getDynamicValues: async ({ projectId, workflowId, prisma }) => {
        const projectWorkflows = await prisma.workflow.findMany({
          where: {
            AND: [
              {
                FK_projectId: projectId,
              },
              {
                id: {
                  not: workflowId,
                },
              },
              {
                strategy: { in: ['manual', 'schedule'] },
              },
            ],
          },
          select: {
            id: true,
            name: true,
          },
        });

        return projectWorkflows.map((workflow) => ({
          label: workflow.name,
          value: workflow.id,
        }));
      },
      required: {
        missingMessage: 'Workflow is required',
        missingStatus: 'warning',
      },
    }),
    {
      id: 'itemVariableName',
      inputType: 'text',
      label: 'Item Variable Name',
      description: 'The name of the variable to pass each item as to the workflow.',
      defaultValue: 'item',
      required: {
        missingMessage: 'Item variable name is required',
        missingStatus: 'warning',
      },
    },
  ],
  aiSchema: z.object({
    list: z.string(),
    workflowId: z.string(),
    itemVariableName: z.string(),
  }),
  run: async ({
    configValue,
    workflowId: requestingWorkflowId,
    projectId,
    agentId,
    prisma,
    execution,
  }) => {
    if (requestingWorkflowId === configValue.workflowId) {
      throw new Error(`Workflow cannot run itself`);
    }

    // Parse the list from JSON
    let items;
    try {
      items = JSON.parse(configValue.list);
    } catch (error) {
      throw new Error(`Invalid JSON list: ${error.message}`);
    }

    if (!Array.isArray(items)) {
      throw new Error('The provided list must be a valid JSON array');
    }

    // Check if the workflow exists in the project
    const workflowExistsInProject = await prisma.workflow.findFirst({
      where: {
        AND: [
          {
            id: configValue.workflowId,
          },
          {
            FK_projectId: projectId,
          },
        ],
      },
    });

    if (!workflowExistsInProject) {
      throw new Error(`Workflow not found: ${configValue.workflowId}`);
    }

    const results = [];
    const errors = [];

    // Process each item in the list
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        // Create input data object with the current item
        const inputData = {
          [configValue.itemVariableName]: item
        };
        
        // Use the execution service to run the workflow
        const newExecution = await execution.manuallyExecuteWorkflow({
          workflowId: configValue.workflowId,
          skipQueue: true,
          inputData: inputData,
        });

        if (!newExecution) {
          throw new Error(
            `Could not execute workflow for item at index ${i}: ${configValue.workflowId}`
          );
        }

        const executionWithProject = await prisma.execution.findUnique({
          where: {
            id: newExecution.id,
          },
          select: {
            workflow: {
              select: {
                FK_projectId: true,
              },
            },
          },
        });

        const maxPolls = 30;
        const pollIntervalInSeconds = 2;
        let polls = 0;

        const executionLink = `${process.env.CLIENT_URL}/projects/${executionWithProject.workflow.FK_projectId}/executions/${newExecution.id}`;

        // Poll for execution completion
        while (polls < maxPolls) {
          const execution = await prisma.execution.findUnique({
            where: {
              id: newExecution.id,
            },
            select: {
              status: true,
              statusMessage: true,
              output: true,
            },
          });

          if (execution.status === 'FAILED') {
            throw new Error(
              `${execution.statusMessage}.${agentId ? ` For more details visit: ${executionLink}` : ''}`
            );
          } else if (execution.status === 'SUCCESS') {
            results.push({
              executionId: newExecution.id,
              executionLink,
              statusMessage: execution.statusMessage,
              data: execution.output,
              index: i,
              item,
            });
            break;
          } else if (execution.status === 'RUNNING') {
            await new Promise((resolve) =>
              setTimeout(resolve, pollIntervalInSeconds * 1000)
            );
            polls++;
          } else if (execution.status === 'NEEDS_INPUT') {
            throw new Error(
              `Workflows that need input cannot be triggered in a loop.${agentId ? ` For more details visit: ${executionLink}` : ''}`
            );
          } else if (execution.status === 'SCHEDULED') {
            throw new Error(
              `Workflows that wait or are scheduled cannot be triggered in a loop.${agentId ? ` For more details visit: ${executionLink}` : ''}`
            );
          } else {
            throw new Error(`Execution status unknown: ${execution.status}`);
          }
        }

        if (polls >= maxPolls) {
          throw new Error(
            `Workflow execution time out after ${maxPolls * pollIntervalInSeconds} seconds for item at index ${i}.${agentId ? ` For more details visit: ${executionLink}` : ''}`
          );
        }
      } catch (error) {
        errors.push({
          index: i,
          item,
          error: error.message,
        });
      }
    }

    return {
      totalItems: items.length,
      successfulExecutions: results.length,
      failedExecutions: errors.length,
      results,
      errors,
    };
  },
  mockRun: async ({ configValue, prisma }) => {
    let items;
    try {
      items = JSON.parse(configValue.list);
      if (!Array.isArray(items)) {
        return {
          error: 'The provided list must be a valid JSON array',
        };
      }
    } catch (error) {
      return {
        error: `Invalid JSON list: ${error.message}`,
      };
    }

    const workflowWithOutputData = await prisma.workflow.findUnique({
      where: { id: configValue.workflowId },
      select: { output: true, name: true },
    });

    return {
      totalItems: items.length,
      successfulExecutions: items.length,
      failedExecutions: 0,
      mockResults: `Would run workflow "${workflowWithOutputData?.name || configValue.workflowId}" for ${items.length} items`,
      note: workflowWithOutputData?.output
        ? undefined
        : 'If you want your workflow to return data for each item, make sure to add the "Output Workflow Data" action to your workflow.',
    };
  },
}); 