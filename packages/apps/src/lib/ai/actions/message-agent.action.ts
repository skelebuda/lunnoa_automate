import {
  createAction,
  createDynamicSelectInputField,
  createTextInputField,
} from '@lunnoa-automate/toolkit';
import { v4 } from 'uuid';
import { z } from 'zod';

export const messageAgent = createAction({
  id: 'ai_action_message-agent',
  name: 'Message Agent',
  description: 'Message one of your agents.',
  iconUrl: `https://lecca-io.s3.us-east-2.amazonaws.com/assets/actions/ai_action_message-agent.svg`,
  inputConfig: [
    createDynamicSelectInputField({
      id: 'agentId',
      label: 'Agent',
      description: 'The agent to message within same project.',
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
      id: 'data',
      label: 'Message',
      description: 'The message (data) to forward to the agent.',
      required: {
        missingMessage: 'Content is required',
        missingStatus: 'warning',
      },
      placeholder: 'Add a message',
    }),
    createTextInputField({
      id: 'customIdentifier',
      label: 'Custom Identifier',
      description:
        'This value will be used to reference this conversation in the future. If you provide a value that already exists for this Agent, then the conversation will be continued.',
      placeholder: 'Add optional identifier',
    }),
  ],

  aiSchema: z.object({
    data: z.string().describe('The data to forward to the agent'),
    customIdentifier: z
      .string()
      .nullable()
      .optional()
      .describe(
        'A value to create or reference a conversation with. If not provided the conversation cannot be referenced in the future.',
      ),
    agentId: z.string(),
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
    if (!configValue.data) {
      throw new Error(`No data provided to send to agent`);
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

    let taskName = '';
    const taskDescription: string = requestingAgentId
      ? 'Message from agent'
      : 'Run from workflow';

    if (typeof configValue.data === 'string') {
      taskName =
        configValue.data.length > 30
          ? configValue.data.slice(0, 30) + '...'
          : configValue.data;
    } else if (requestingAgentId) {
      taskName = 'Message from agent';
    } else if (requestingWorkflowId) {
      taskName = 'Run from workflow';
    }

    const newTask = await task.create({
      agentId: configValue.agentId,
      data: {
        name: taskName,
        description: taskDescription,
        customIdentifier: configValue.customIdentifier ?? undefined,
      },
    });

    const messageResult = await task.messageTask({
      messages: [
        {
          id: v4(),
          role: 'user',
          content: configValue.data,
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

    return {
      taskLink,
      response: messageResult as string,
    };
  },

  mockRun: async () => {
    return {
      taskLink: `${process.env.CLIENT_URL}/path/to/agent/task`,
      response: 'The response of the agent',
    };
  },
});
