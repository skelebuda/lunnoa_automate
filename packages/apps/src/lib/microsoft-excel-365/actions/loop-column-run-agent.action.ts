import {
  createAction,
  createDynamicSelectInputField,
  createTextInputField,
} from '@lunnoa-automate/toolkit';
import { v4 } from 'uuid';
import { z } from 'zod';
import { shared } from '../shared/microsoft-excel-365.shared';

export const loopColumnRunAgent = createAction({
  id: 'microsoft-excel-365_action_loop-column-run-agent',
  name: 'Loop Column and Run Agent',
  description: 'Loop through a column in an Excel sheet and run an agent for each cell.',
  inputConfig: [
    shared.fields.dynamicSelectWorkbooks,
    shared.fields.dynamicSelectWorksheets,
    createDynamicSelectInputField({
      id: 'columnId',
      label: 'Column to Loop Through',
      description: 'Select the column to loop through.',
      loadOptions: {
        dependsOn: ['workbookId', 'worksheetId'],
      },
      _getDynamicValues: async ({ connection, workspaceId, http, extraOptions }) => {
        if (!extraOptions?.workbookId || !extraOptions?.worksheetId) {
          return [];
        }
        const url = `https://graph.microsoft.com/v1.0/me/drive/items/${extraOptions.workbookId}/workbook/worksheets/${extraOptions.worksheetId}/usedRange(valuesOnly=true)?$top=1`;
        const response = await http.request({
          method: 'GET',
          url,
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
          workspaceId,
        });
        const headers = response.data?.values?.[0] ?? [];
        return headers
          .map((header: string, index: number) => ({
            value: index.toString(),
            label: header || `Column ${index + 1}`,
          }))
          .filter((h: { label: string }) => h.label);
      },
      required: {
        missingStatus: 'warning',
        missingMessage: 'Column is required',
      },
    }),
    createDynamicSelectInputField({
      id: 'agentId',
      label: 'Agent',
      description: 'The agent to message for each item.',
      placeholder: 'Select an agent',
      hideCustomTab: true,
      _getDynamicValues: async ({ projectId, agentId, prisma }) => {
        const projectAgents = await prisma.agent.findMany({
          where: {
            FK_projectId: projectId,
          },
          select: {
            id: true,
            name: true,
          },
        });

        if (agentId) {
          return projectAgents
            .filter((agent) => agent.id !== agentId)
            .map((agent) => ({
              label: agent.name,
              value: agent.id,
            }));
        }
        return projectAgents.map((agent) => ({
          label: agent.name,
          value: agent.id,
        }));
      },
      required: {
        missingMessage: 'Agent is required',
        missingStatus: 'warning',
      },
    }),
    createTextInputField({
      id: 'customIdentifier',
      label: 'Custom Identifier Prefix',
      description:
        'This value will be used as a prefix to reference conversations in the future. The current list item will be appended to this prefix to create a unique conversation for each item. If left blank, a new conversation will be started for each item.',
      placeholder: 'Add optional identifier prefix',
    }),
  ],

  aiSchema: z.object({
    workbookId: z.string(),
    worksheetId: z.string(),
    columnId: z.string(),
    agentId: z.string(),
    customIdentifier: z.string().nullable().optional(),
  }),

  run: async ({
    configValue,
    connection,
    workspaceId,
    http,
    projectId,
    task,
    agentId: requestingAgentId,
    workflowId: requestingWorkflowId,
  }) => {
    const { workbookId, worksheetId, columnId, agentId, customIdentifier } = configValue;
    const columnIndex = parseInt(columnId, 10);

    const url = `https://graph.microsoft.com/v1.0/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange(valuesOnly=true)`;
    const response = await http.request({
      method: 'GET',
      url,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
      workspaceId,
    });
    const rows = response.data?.values ?? [];

    if (rows.length < 2) {
      return {
        totalItems: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        message: 'No data found in the worksheet to loop through.',
      };
    }

    const items = rows
      .slice(1) // skip header
      .map((row) => row[columnIndex])
      .filter((item) => item !== null && item !== undefined && item !== '');

    if (items.length === 0) {
      return {
        totalItems: 0,
        successfulExecutions: 0,
        failedExecutions: 0,
        message: 'No items found in the selected column',
      };
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        const taskName = String(item).length > 30 ? String(item).slice(0, 30) + '...' : String(item);
        const taskDescription: string = 'Run from Excel loop';

        const taskId = customIdentifier ? `${customIdentifier}-${item}` : undefined;

        const newTask = await task.create({
          agentId: agentId,
          data: {
            name: taskName,
            description: taskDescription,
            customIdentifier: taskId,
          },
        });

        const messageResult = await task.messageTask({
          messages: [
            {
              id: v4(),
              role: 'user',
              content: String(item),
            },
          ],
          taskId: newTask.id,
          requestingWorkflowId: requestingWorkflowId,
          workspaceId,
          requestingAgentId: requestingAgentId,
          shouldStream: false,
          simpleResponse: true,
        });

        const taskLink = `${process.env.CLIENT_URL}/projects/${projectId}/agents/${agentId}/tasks/${newTask.id}`;

        results.push({
          taskLink,
          response: messageResult as string,
          itemIndex: i,
          item,
        });
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

  mockRun: async ({ configValue }) => {
    return {
      mockResults: `Would message agent "${
        configValue.agentId || 'N/A'
      }" for each item in column ID ${configValue.columnId} of worksheet ${configValue.worksheetId}`,
    };
  },
}); 