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
      [statusColumnId, statusValue] = status.split('|');
    }

    const columnsQuery = `query($boardId: ID!) {
      boards(ids: [$boardId]) {
        columns(types: [status]) {
          id
          title
        }
      }
    }`;
    const columnsVariables = { boardId: Number(boardId) };
    const columnsData = await shared.mondayApiRequest({
      http,
      workspaceId,
      connection,
      query: columnsQuery,
      variables: columnsVariables,
    });

    const statusColumns = columnsData.boards[0].columns;
    const statusColumnIds = statusColumns.map((c: { id: string }) => c.id);

    const query = `
      query ($boardId: ID!, $personColumnId: String!, $userId: String!${
        status ? ', $statusColumnId: String!, $statusValue: String!' : ''
      }) {
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
            ${
              statusColumnIds.length > 0
                ? `column_values(ids: ${JSON.stringify(statusColumnIds)}) {
              id
              text
            }`
                : ''
            }
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

    const items = data.items_page_by_column_values.items;

    const processedItems = items.map(
      (item: {
        id: string;
        name: string;
        state: string;
        updated_at: string;
        column_values: { id: string; text: string }[];
      }) => {
        const statuses: Record<string, string> = {};
        if (item.column_values) {
          for (const colVal of item.column_values) {
            const column = statusColumns.find(
              (c: { id: string }) => c.id === colVal.id,
            );
            if (column) {
              statuses[column.title] = colVal.text;
            }
          }
        }
        return {
          id: item.id,
          name: item.name,
          state: item.state,
          updated_at: item.updated_at,
          statuses,
        };
      },
    );

    return { tasks: processedItems };
  },
  mockRun: async () => {
    return {
      tasks: [
        {
          id: '123',
          name: 'Mock Task 1',
          state: 'active',
          updated_at: new Date().toISOString(),
          statuses: { Status: 'Working on it' },
        },
        {
          id: '456',
          name: 'Mock Task 2',
          state: 'active',
          updated_at: new Date().toISOString(),
          statuses: { Status: 'Done' },
        },
      ],
    };
  },
}); 