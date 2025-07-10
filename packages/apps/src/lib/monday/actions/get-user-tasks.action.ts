import {
  createAction,
} from '@lunnoa-automate/toolkit';
import { z } from 'zod';
import { shared } from '../shared/monday.shared';

export const getUserTasks = createAction({
  id: 'monday_action_get-user-tasks',
  name: 'Get User Tasks',
  description: "Get all tasks assigned to a specific user on a board.",
  inputConfig: [
    shared.fields.dynamicSelectBoard,
    shared.fields.dynamicSelectPersonColumn,
    shared.fields.dynamicSelectUser,
    shared.fields.dynamicSelectStatus,
  ],
  aiSchema: z.object({
    boardId: z.string(),
    personColumnId: z.string(),
    userId: z.string(),
    status: z.string().optional(),
  }),
  run: async ({ configValue, http, workspaceId, connection }) => {
    const { boardId, personColumnId, userId, status } = configValue;

    let statusColumnId: string | undefined;
    let statusValue: string | undefined;

    if (status) {
      [statusColumnId, statusValue] = status.split(':');
    }

    const query = `
      query ($boardId: ID!, $personColumnId: String!, $userId: String!${status ? ', $statusColumnId: String!, $statusValue: String!' : ''}) {
        items_page_by_column_values (
          board_id: $boardId,
          columns: [
            {
              column_id: $personColumnId,
              column_values: [$userId]
            }
            ${status ? `
            ,{
              column_id: $statusColumnId,
              column_values: [$statusValue]
            }` : ''}
          ]
        ) {
          cursor
          items {
            id
            name
            state
            updated_at
          }
        }
      }
    `;

    const variables: Record<string, any> = {
      boardId: Number(boardId),
      personColumnId,
      userId: String(userId),
    };

    if (status && statusColumnId && statusValue) {
      variables.statusColumnId = statusColumnId;
      variables.statusValue = statusValue;
    }

    const data = await shared.mondayApiRequest({
      http,
      workspaceId,
      connection,
      query,
      variables,
    });

    return { tasks: data.items_page_by_column_values.items };
  },
  mockRun: async () => {
    return {
      tasks: [
        { id: '123', name: 'Mock Task 1', state: 'Working on it', updated_at: new Date().toISOString() },
        { id: '456', name: 'Mock Task 2', state: 'Done', updated_at: new Date().toISOString() },
      ],
    };
  },
}); 