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
  ],
  aiSchema: z.object({
    boardId: z.string(),
    personColumnId: z.string(),
    userId: z.string(),
  }),
  run: async ({ configValue, http, workspaceId, connection }) => {
    const { boardId, personColumnId, userId } = configValue;

    const query = `
      query ($boardId: ID!, $personColumnId: String!, $userId: String!) {
        items_page_by_column_values (
          board_id: $boardId,
          columns: [
            {
              column_id: $personColumnId,
              column_values: [$userId]
            }
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

    const variables = {
      boardId: Number(boardId),
      personColumnId,
      userId: String(userId),
    };

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