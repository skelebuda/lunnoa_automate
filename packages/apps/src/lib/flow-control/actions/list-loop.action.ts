import { createAction, createDynamicSelectInputField, createJsonInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const listLoop = createAction({
  id: 'flow-control_action_list-loop',
  name: 'List Loop',
  description: 'Loop through CSV data converted to JSON and run a workflow for each item.',
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
    createJsonInputField({
      id: 'csvJsonData',
      label: 'CSV JSON Data',
      description: 'The JSON data from a Convert CSV to JSON action.',
      required: {
        missingMessage: 'CSV JSON data is required',
        missingStatus: 'warning',
      },
    }),
    createDynamicSelectInputField({
      id: 'variableId',
      label: 'Variable to Update',
      description: 'Select a variable that will be updated with each row from the CSV data.',
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
      label: 'Workflow to Run for Each Row',
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
    csvJsonData: z.string(),
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

    // Parse the CSV JSON data
    let csvRows;
    try {
      // Check if csvJsonData is undefined or empty
      if (!configValue.csvJsonData) {
        throw new Error('CSV JSON data is missing or empty');
      }
      
      let parsedInput;
      
      // Handle both string and object inputs
      if (typeof configValue.csvJsonData === 'string') {
        parsedInput = JSON.parse(configValue.csvJsonData);
      } else if (typeof configValue.csvJsonData === 'object') {
        parsedInput = configValue.csvJsonData;
      } else {
        throw new Error(`Invalid CSV JSON data type: ${typeof configValue.csvJsonData}`);
      }
      
      // Extract the result array from the CSV to JSON conversion output
      if (parsedInput && typeof parsedInput === 'object') {
        if (Array.isArray(parsedInput)) {
          csvRows = parsedInput;
        } else if (Array.isArray(parsedInput.result)) {
          csvRows = parsedInput.result;
        } else {
          throw new Error('Invalid CSV JSON data format. Expected an array or an object with a "result" array property.');
        }
      } else {
        throw new Error('Invalid CSV JSON data format. Expected an object with a "result" array property.');
      }
    } catch (error) {
      throw new Error(`Failed to parse CSV JSON data: ${error.message}`);
    }

    if (csvRows.length === 0) {
      return {
        totalItems: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        message: 'No rows found in CSV data',
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

    // Get the workflow to run
    const executionWithProject = await prisma.execution.findFirst({
      where: {
        id: requestingWorkflowId,
      },
      select: {
        workflow: {
          select: {
            FK_projectId: true,
          },
        },
      },
    });

    if (!executionWithProject) {
      throw new Error('Could not find execution');
    }

    // Process each row in the CSV data
    const results = [];
    const errors = [];

    for (let i = 0; i < csvRows.length; i++) {
      const row = csvRows[i];
      
      try {
        // Update the variable with the current row
        await prisma.variable.update({
          where: { id: variable.id },
          data: { value: JSON.stringify(row) },
        });

        // Run the workflow
        const newExecution = await execution.manuallyExecuteWorkflow({
          workflowId: configValue.workflowId,
          skipQueue: true,
          inputData: {},
        });

        // Poll for execution completion
        const maxPolls = 30;
        const pollIntervalInSeconds = 2;
        let polls = 0;

        const executionLink = `${process.env.CLIENT_URL}/projects/${executionWithProject.workflow.FK_projectId}/executions/${newExecution.id}`;

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
              rowIndex: i,
              row,
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
            `Workflow execution time out after ${maxPolls * pollIntervalInSeconds} seconds for row at index ${i}.${agentId ? ` For more details visit: ${executionLink}` : ''}`
          );
        }
      } catch (error) {
        errors.push({
          rowIndex: i,
          row,
          error: error.message,
        });
      }
    }

    return {
      totalItems: csvRows.length,
      successfulExecutions: results.length,
      failedExecutions: errors.length,
      variableName: variable.name,
      results,
      errors,
    };
  },
  mockRun: async ({ configValue, prisma }) => {
    let csvRows;
    try {
      const parsedInput = JSON.parse(configValue.csvJsonData);
      
      // Extract the result array from the CSV to JSON conversion output
      if (parsedInput && typeof parsedInput === 'object' && Array.isArray(parsedInput.result)) {
        csvRows = parsedInput.result;
      } else {
        return {
          error: 'Invalid CSV JSON data format. Expected an object with a "result" array property.',
        };
      }
    } catch (error) {
      return {
        error: `Failed to parse CSV JSON data: ${error.message}`,
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
      totalItems: csvRows.length,
      successfulExecutions: csvRows.length,
      failedExecutions: 0,
      variableName: variable?.name || 'Unknown variable',
      mockResults: `Would run workflow "${workflowWithOutputData?.name || configValue.workflowId}" for ${csvRows.length} CSV rows, updating variable "${variable?.name || configValue.variableId}" for each row`,
      note: workflowWithOutputData?.output
        ? undefined
        : 'If you want your workflow to return data for each row, make sure to add the "Output Workflow Data" action to your workflow.',
    };
  },
}); 