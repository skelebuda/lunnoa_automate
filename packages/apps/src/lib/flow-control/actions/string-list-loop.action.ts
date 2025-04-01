import { createAction, createDynamicSelectInputField, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const stringListLoop = createAction({
  id: 'flow-control_action_string-list-loop',
  name: 'String List Loop',
  description: 'Loop through a comma-separated list and run a workflow for each item.',
  iconUrl: `https://unpkg.com/@mynaui/icons/icons/repeat.svg`,
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
    createTextInputField({
      id: 'stringList',
      label: 'Comma-Separated List',
      description: 'A list of items separated by commas (e.g., "item1, item2, item3")',
      required: {
        missingMessage: 'Comma-separated list is required',
        missingStatus: 'warning',
      },
    }),
    createDynamicSelectInputField({
      id: 'variableId',
      label: 'Variable to Update',
      description: 'Select a variable that will be updated with each item from the list.',
      _getDynamicValues: async ({ projectId, workspaceId, prisma }) => {
        const variables = await prisma.variable.findMany({
          where: {
            OR: [
              {
                FK_projectId: projectId,
              },
              {
                AND: [
                  {
                    FK_workspaceId: workspaceId,
                  },
                  {
                    FK_projectId: null,
                  },
                ],
              },
            ],
          },
          select: {
            id: true,
            name: true,
            dataType: true,
          },
        });

        return variables.map((variable) => ({
          label: variable.name,
          value: variable.id,
        }));
      },
      required: {
        missingMessage: 'Variable is required',
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
  ],
  aiSchema: z.object({
    stringList: z.string(),
    variableId: z.string(),
    workflowId: z.string(),
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

    // Parse the string list
    let items = [];
    try {
      if (!configValue.stringList) {
        throw new Error('String list is empty');
      }
      
      // Split by comma and trim whitespace
      items = configValue.stringList.split(',').map(item => item.trim()).filter(item => item.length > 0);
    } catch (error) {
      throw new Error(`Failed to parse string list: ${error.message}`);
    }

    if (items.length === 0) {
      return {
        totalItems: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        message: 'No items found in the list',
      };
    }

    // Get the variable to update
    const variable = await prisma.variable.findUnique({
      where: { id: configValue.variableId },
      select: { id: true, name: true, dataType: true },
    });

    if (!variable) {
      throw new Error(`Variable with ID ${configValue.variableId} not found`);
    }

    // Process each item in the list
    const results = [];
    const errors = [];

    const executionLink = (newExecutionId) => 
      `${process.env.CLIENT_URL}/projects/${projectId}/executions/${newExecutionId}`;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        // Update the variable with the current item
        await prisma.variable.update({
          where: { id: variable.id },
          data: { value: item },
        });

        // Run the workflow
        const newExecution = await execution.manuallyExecuteWorkflow({
          workflowId: configValue.workflowId,
          skipQueue: true,
          inputData: {},
        });

        // Use the function to generate the link
        const execLink = executionLink(newExecution.id);

        // Poll for execution completion
        const maxPolls = 30;
        const pollIntervalInSeconds = 2;
        let polls = 0;

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
              `${execution.statusMessage}.${agentId ? ` For more details visit: ${execLink}` : ''}`
            );
          } else if (execution.status === 'SUCCESS') {
            results.push({
              executionId: newExecution.id,
              executionLink: execLink,
              statusMessage: execution.statusMessage,
              data: execution.output,
              itemIndex: i,
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
              `Workflows that need input cannot be triggered in a loop.${agentId ? ` For more details visit: ${execLink}` : ''}`
            );
          } else if (execution.status === 'SCHEDULED') {
            throw new Error(
              `Workflows that wait or are scheduled cannot be triggered in a loop.${agentId ? ` For more details visit: ${execLink}` : ''}`
            );
          } else {
            throw new Error(`Execution status unknown: ${execution.status}`);
          }
        }

        if (polls >= maxPolls) {
          throw new Error(
            `Workflow execution time out after ${maxPolls * pollIntervalInSeconds} seconds for item at index ${i}.${agentId ? ` For more details visit: ${execLink}` : ''}`
          );
        }
      } catch (error) {
        errors.push({
          itemIndex: i,
          item,
          error: error.message,
        });
      }
    }

    return {
      totalItems: items.length,
      successfulExecutions: results.length,
      failedExecutions: errors.length,
      variableName: variable.name,
      results,
      errors,
    };
  },
  mockRun: async ({ configValue, prisma }) => {
    let items = [];
    try {
      if (!configValue.stringList) {
        return {
          error: 'String list is empty',
        };
      }
      
      // Split by comma and trim whitespace
      items = configValue.stringList.split(',').map(item => item.trim()).filter(item => item.length > 0);
    } catch (error) {
      return {
        error: `Failed to parse string list: ${error.message}`,
      };
    }

    const workflowWithOutputData = await prisma.workflow.findUnique({
      where: { id: configValue.workflowId },
      select: { output: true, name: true },
    });

    const variable = await prisma.variable.findUnique({
      where: { id: configValue.variableId },
      select: { name: true },
    });

    return {
      totalItems: items.length,
      successfulExecutions: items.length,
      failedExecutions: 0,
      variableName: variable?.name || 'Unknown variable',
      mockResults: `Would run workflow "${workflowWithOutputData?.name || configValue.workflowId}" for ${items.length} items, updating variable "${variable?.name || configValue.variableId}" for each item`,
      note: workflowWithOutputData?.output
        ? undefined
        : 'If you want your workflow to return data for each item, make sure to add the "Output Workflow Data" action to your workflow.',
    };
  },
}); 