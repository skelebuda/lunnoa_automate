import {
  createAction,
  createDynamicSelectInputField,
  createTextInputField,
} from '@lunnoa-automate/toolkit';
import { v4 } from 'uuid';
import { z } from 'zod';

export const listLoopAgent = createAction({
  id: 'ai_action_list-loop-agent',
  name: 'List Loop Agent',
  description: 'Loop through a comma-separated list and message an agent for each item.',
  iconUrl: `https://lecca-io.s3.us-east-2.amazonaws.com/assets/actions/ai_action_message-agent.svg`,
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
    stringList: z.string(),
    agentId: z.string(),
    customIdentifier: z.string().nullable().optional(),
  }),

  run: async ({
    configValue,
    projectId,
    workflowId: requestingWorkflowId,
    workspaceId,
    agentId: requestingAgentId,
    prisma,
    task,
  }) => {
    // Parse the string list
    let items = [];
    try {
      if (!configValue.stringList) {
        throw new Error('String list is empty');
      }
      items = configValue.stringList
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
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

    const agentExistsInProject = await prisma.agent.findFirst({
      where: {
        AND: [{ id: configValue.agentId }, { FK_projectId: projectId }],
      },
      select: { id: true },
    });

    if (!agentExistsInProject) {
      throw new Error(
        `Agent does not exist in this project: ${configValue.agentId}`,
      );
    }

    const results = [];
    const errors = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      try {
        const taskName = item.length > 30 ? item.slice(0, 30) + '...' : item;
        const taskDescription: string = requestingAgentId
          ? 'Message from agent loop'
          : 'Run from workflow loop';

        const customIdentifier = configValue.customIdentifier
          ? `${configValue.customIdentifier}-${item}`
          : undefined;

        const newTask = await task.create({
          agentId: configValue.agentId,
          data: {
            name: taskName,
            description: taskDescription,
            customIdentifier: customIdentifier,
          },
        });

        const messageResult = await task.messageTask({
          messages: [
            {
              id: v4(),
              role: 'user',
              content: item,
            },
          ],
          taskId: newTask.id,
          requestingWorkflowId: requestingWorkflowId,
          workspaceId,
          requestingAgentId: requestingAgentId,
          shouldStream: false,
          simpleResponse: true,
        });

        const taskLink = `${process.env.CLIENT_URL}/projects/${projectId}/agents/${configValue.agentId}/tasks/${newTask.id}`;

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
    let items = [];
    try {
      if (!configValue.stringList) {
        return {
          error: 'String list is empty',
        };
      }
      items = configValue.stringList
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    } catch (error) {
      return {
        error: `Failed to parse string list: ${error.message}`,
      };
    }

    return {
      totalItems: items.length,
      successfulExecutions: items.length,
      failedExecutions: 0,
      mockResults: `Would message agent "${
        configValue.agentId || 'N/A'
      }" for ${items.length} items`,
    };
  },
});
