import {
  createAction,
  createDynamicSelectInputField,
  createTextInputField,
} from '@lunnoa-automate/toolkit';
import { z } from 'zod';
import { shared } from '../shared/monday.shared';

export const createItem = createAction({
  id: 'monday_action_create-item',
  name: 'Create Item',
  description: "Create a new item (task) on a monday.com board.",
  inputConfig: [
    shared.fields.dynamicSelectBoard,
    createTextInputField({
      id: 'itemName',
      label: 'Item Name',
      description: 'The name of the item (task) to create.',
      required: {
        missingMessage: 'Item name is required',
        missingStatus: 'warning',
      },
    }),
    createDynamicSelectInputField({
      id: 'personColumnId',
      label: 'Person Column',
      description: 'Select the person column to assign the user to. (Optional)',
      loadOptions: {
        dependsOn: ['boardId'],
      },
      _getDynamicValues: async ({ http, workspaceId, connection, extraOptions }) => {
        const boardId = extraOptions?.boardId as string;
        if (!boardId) return [];

        const query = `query($boardId: ID!) {
          boards(ids: [$boardId]) {
            columns(types: [people]) {
              id
              title
            }
          }
        }`;
        const variables = { boardId: Number(boardId) };

        const data = await shared.mondayApiRequest({
          http,
          workspaceId,
          connection,
          query,
          variables,
        });

        return data.boards[0].columns.map((column: { id: string; title: string }) => ({
          label: column.title,
          value: column.id,
        }));
      },
    }),
    createDynamicSelectInputField({
        id: 'userId',
        label: 'User to Assign',
        description: 'Select a user to assign the task to. (Optional)',
        loadOptions: {
            dependsOn: ['personColumnId']
        },
        _getDynamicValues: async ({ http, workspaceId, connection, extraOptions }) => {
            if(!extraOptions?.personColumnId) return [];
            const query = `query { users { id name } }`;
            const data = await shared.mondayApiRequest({
              http,
              workspaceId,
              connection,
              query,
            });
    
            return data.users.map((user: { id: string; name: string }) => ({
              label: user.name,
              value: user.id,
            }));
        }
    })
  ],
  aiSchema: z.object({
    boardId: z.string(),
    itemName: z.string(),
    personColumnId: z.string().optional(),
    userId: z.string().optional(),
  }),
  run: async ({ configValue, http, workspaceId, connection }) => {
    const { boardId, itemName, personColumnId, userId } = configValue;

    let columnValues = {};
    if (personColumnId && userId) {
      columnValues = {
        [personColumnId]: {
          personsAndTeams: [{ id: Number(userId), kind: 'person' }],
        },
      };
    }

    const query = `
      mutation create_item($boardId: ID!, $itemName: String!, $columnValues: JSON) {
        create_item(board_id: $boardId, item_name: $itemName, column_values: $columnValues) {
          id
          name
        }
      }
    `;

    const variables = {
      boardId: Number(boardId),
      itemName,
      columnValues: JSON.stringify(columnValues),
    };

    const data = await shared.mondayApiRequest({
      http,
      workspaceId,
      connection,
      query,
      variables,
    });

    return data.create_item;
  },
  mockRun: async () => {
    return {
      id: '1234567890',
      name: 'Mock Item',
    };
  },
}); 