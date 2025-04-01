import { createAction, createDynamicSelectInputField, createJsonInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const listLoop = createAction({
  id: 'flow-control_action_list-loop',
  name: 'List Loop',
  description: 'Loop through a list, set a variable for each item, and run a workflow.',
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
      description: 'The list of items to iterate through. Can be a JSON array or an object with a "result" property containing an array (like from CSV to JSON conversion).',
      required: {
        missingMessage: 'List is required',
        missingStatus: 'warning',
      },
    }),
    createDynamicSelectInputField({
      id: 'variableId',
      label: 'Variable to Update',
      description: 'Select a variable that will be updated with each item in the list.',
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
    list: z.string(),
    variableId: z.string(),
    workflowId: z.string(),
  }),
  run: async ({
    configValue,
    workflowId: requestingWorkflowId,
    projectId,
    workspaceId,
    agentId,
    prisma,
    execution,
  }) => {
    if (requestingWorkflowId === configValue.workflowId) {
      throw new Error(`Workflow cannot run itself`);
    }

    // Parse the list from JSON and handle CSV to JSON conversion format
    let items;
    try {
      const parsedInput = JSON.parse(configValue.list);
      
      // Handle both direct arrays and objects with a "result" property (from CSV to JSON)
      if (Array.isArray(parsedInput)) {
        items = parsedInput;
      } else if (parsedInput && typeof parsedInput === 'object') {
        // Check if this is the format from CSV to JSON conversion
        if (Array.isArray(parsedInput.result)) {
          items = parsedInput.result;
        } else {
          // If it's a single object, wrap it in an array
          items = [parsedInput];
        }
      } else {
        throw new Error('Invalid input format');
      }
    } catch (error) {
      throw new Error(`Invalid JSON list: ${error.message}`);
    }

    if (!Array.isArray(items)) {
      throw new Error('The provided list must be a valid JSON array or an object with a "result" array property');
    }

    if (items.length === 0) {
      return {
        totalItems: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        results: [],
        errors: [],
        message: "The list is empty, no workflows were executed."
      };
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

    // Check if the variable exists and get its data type
    const variable = await prisma.variable.findFirst({
      where: {
        AND: [
          { id: configValue.variableId },
          {
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
        ],
      },
      select: {
        id: true,
        name: true,
        dataType: true,
      },
    });

    if (!variable) {
      throw new Error('Variable not found');
    }

    const results = [];
    const errors = [];

    // Process each item in the list
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      
      try {
        // Update the variable with the current item
        let formattedValue = item;
        
        // Format the value based on the variable's data type
        switch (variable.dataType) {
          case 'boolean':
            if (typeof item !== 'boolean' && item !== 'true' && item !== 'false') {
              throw new Error(`Item at index ${i} cannot be converted to boolean`);
            }
            formattedValue = item === 'true' ? true : Boolean(item);
            break;
          case 'number':
            if (typeof item !== 'number' && isNaN(Number(item))) {
              throw new Error(`Item at index ${i} cannot be converted to number`);
            }
            formattedValue = Number(item);
            break;
          case 'string':
            formattedValue = String(item);
            break;
          case 'date':
            try {
              // Attempt to parse as date if it's a string
              if (typeof item === 'string') {
                const date = new Date(item);
                if (isNaN(date.getTime())) {
                  throw new Error();
                }
                formattedValue = date.toISOString();
              } else {
                throw new Error();
              }
            } catch {
              throw new Error(`Item at index ${i} cannot be converted to date`);
            }
            break;
          case 'json':
            // If it's already an object, we can use it directly
            if (typeof item === 'object') {
              formattedValue = item;
            } else {
              // Try to parse as JSON if it's a string
              try {
                formattedValue = typeof item === 'string' ? JSON.parse(item) : item;
              } catch {
                throw new Error(`Item at index ${i} cannot be converted to JSON`);
              }
            }
            break;
        }

        // Update the variable with the current item
        await prisma.variable.update({
          where: {
            id: configValue.variableId,
          },
          data: {
            value: formattedValue,
          },
        });
        
        // Run the workflow
        const newExecution = await execution.manuallyExecuteWorkflow({
          workflowId: configValue.workflowId,
          skipQueue: true,
          inputData: {}, // No direct input data needed as we're using variables
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
      variableName: variable.name,
      results,
      errors,
    };
  },
  mockRun: async ({ configValue, prisma }) => {
    let items;
    try {
      const parsedInput = JSON.parse(configValue.list);
      
      // Handle both direct arrays and objects with a "result" property (from CSV to JSON)
      if (Array.isArray(parsedInput)) {
        items = parsedInput;
      } else if (parsedInput && typeof parsedInput === 'object') {
        // Check if this is the format from CSV to JSON conversion
        if (Array.isArray(parsedInput.result)) {
          items = parsedInput.result;
        } else {
          // If it's a single object, wrap it in an array
          items = [parsedInput];
        }
      } else {
        return {
          error: 'Invalid input format',
        };
      }
    } catch (error) {
      return {
        error: `Invalid JSON list: ${error.message}`,
      };
    }

    if (!Array.isArray(items)) {
      return {
        error: 'The provided list must be a valid JSON array or an object with a "result" array property',
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
      mockResults: `Would run workflow "${workflowWithOutputData?.name || configValue.workflowId}" for ${items.length} items, updating variable "${variable?.name || configValue.variableId}" for each iteration`,
      note: workflowWithOutputData?.output
        ? undefined
        : 'If you want your workflow to return data for each item, make sure to add the "Output Workflow Data" action to your workflow.',
    };
  },
}); 