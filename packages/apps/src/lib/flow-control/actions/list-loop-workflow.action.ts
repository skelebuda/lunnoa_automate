import { createAction, createDynamicSelectInputField, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const listLoopWorkflow = createAction({
  id: 'flow-control_action_list-loop-workflow',
  name: 'String List Loop',
  description: 'Loop through a comma-separated list and run a workflow for each item.',
  iconUrl: `https://lecca-io.s3.us-east-2.amazonaws.com/assets/actions/flow-control_action_run-workflow.svg`,
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
    createDynamicSelectInputField({
      id: 'targetInputId',
      label: 'Loop Item Target Input',
      description:
        'Select the input field of the target workflow to populate with the current item from the list.',
      placeholder: 'Select an input',
      hideCustomTab: true,
      loadOptions: {
        dependsOn: ['workflowId'],
      },
      _getDynamicValues: async ({ projectId, extraOptions, prisma }) => {
        const { workflowId } = extraOptions as { workflowId: string };

        if (!workflowId) {
          throw new Error('Workflow ID is required to get target inputs.');
        }

        const workflow = await prisma.workflow.findFirst({
          where: {
            AND: [{ id: workflowId }, { FK_projectId: projectId }],
          },
          select: {
            triggerNode: true,
          },
        });

        if (!workflow) {
          return [];
        }

        const triggerNode = workflow.triggerNode as any;

        const customInputs = triggerNode.value?.customInputConfig ?? [];

        return customInputs.map((input: any) => ({
          label: input.label || input.id,
          value: input.id,
        }));
      },
      required: {
        missingMessage: 'Target input is required',
        missingStatus: 'warning',
      },
    }),
    {
      id: 'customInputConfigValues',
      inputType: 'dynamic-input-config',
      label: 'Workflow Input Data',
      description:
        'These are the custom fields configured in the workflow "Manually Run" trigger. The selected Loop Item Target Input will be overriden by the loop.',
      loadOptions: {
        dependsOn: ['workflowId'],
        workflowOnly: true,
        forceRefresh: true,
      },
      _getDynamicValues: async ({ projectId, extraOptions, prisma }) => {
        const { workflowId } = extraOptions as { workflowId: string };

        if (!workflowId) {
          throw new Error('Workflow ID is required');
        }

        const workflow = await prisma.workflow.findFirst({
          where: {
            AND: [
              { id: workflowId },
              {
                FK_projectId: projectId,
              },
            ],
          },
          select: {
            triggerNode: true,
          },
        });

        if (!workflow) {
          throw new Error('Workflow not found');
        }

        const triggerNode = workflow.triggerNode as any;

        return (
          triggerNode.value?.customInputConfig?.map((input: any) => {
            const formattedInput = { ...input };
            formattedInput.label = input.id;
            return formattedInput;
          }) ?? []
        );
      },
    },
  ],
  aiSchema: z.object({
    stringList: z.string(),
    workflowId: z.string(),
    targetInputId: z.string(),
    customInputConfigValues: z.record(z.union([z.string(), z.number()])).optional(),
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
    // Process each item in the list
    const results = [];
    const errors = [];

    const executionLink = (newExecutionId) => 
      `${process.env.CLIENT_URL}/projects/${projectId}/executions/${newExecutionId}`;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        const inputData = {
          ...(configValue.customInputConfigValues ?? {}),
          [configValue.targetInputId]: item,
        };
        // Run the workflow
        const newExecution = await execution.manuallyExecuteWorkflow({
          workflowId: configValue.workflowId,
          skipQueue: true,
          inputData,
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