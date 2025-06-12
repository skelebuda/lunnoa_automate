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
      query ($boardId: ID!, $columnId: String!, $columnValue: String!) {
        items_by_multiple_column_values (
          board_id: $boardId,
          column_id: $columnId,
          column_value: $columnValue
        ) {
          id
          name
          state
          updated_at
        }
      }
    `;

    const variables = {
      boardId: Number(boardId),
      columnId: personColumnId,
      columnValue: String(userId),
    };

    const data = await shared.mondayApiRequest({
      http,
      workspaceId,
      connection,
      query,
      variables,
    });

    return { tasks: data.items_by_multiple_column_values };
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