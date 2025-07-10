import {
  createAction,
  createDynamicSelectInputField,
  createTextInputField,
} from '@lunnoa-automate/toolkit';
import { z } from 'zod';
import { shared } from '../shared/monday.shared';

export const updateItemStatus = createAction({
  id: 'monday_action_update-item-status',
  name: 'Update Item Status',
  description: 'Update the status of a specific item on a Monday.com board.',
  inputConfig: [
    createTextInputField({
      id: 'itemId',
      label: 'Item ID',
      description: 'The ID of the item to update',
      required: {
        missingMessage: 'Item ID is required',
        missingStatus: 'error',
      },
    }),
    createDynamicSelectInputField({
      id: 'status',
      label: 'New Status',
      description: 'The new status value to set',
      required: {
        missingMessage: 'New status value is required',
        missingStatus: 'error',
      },
      loadOptions: {
        dependsOn: ['itemId'],
      },
      _getDynamicValues: async ({
        http,
        workspaceId,
        connection,
        extraOptions,
      }) => {
        const itemId = extraOptions?.itemId as string;
        if (!itemId || isNaN(Number(itemId))) {
          return [];
        }

        const itemQuery = `query($itemIds: [ID!]) { items(ids: $itemIds) { board { id } } }`;
        const itemVariables = { itemIds: [Number(itemId)] };

        const itemData = await shared.mondayApiRequest({
          http,
          workspaceId,
          connection,
          query: itemQuery,
          variables: itemVariables,
        });

        if (
          !itemData.items ||
          itemData.items.length === 0 ||
          !itemData.items[0].board
        ) {
          return [];
        }
        const boardId = itemData.items[0].board.id;

        const statusQuery = `query($boardIds: [ID!]) {
          boards(ids: $boardIds) {
            columns(types: [status]) {
              id
              title
              settings_str
            }
          }
        }`;
        const statusVariables = { boardIds: [Number(boardId)] };

        const statusData = await shared.mondayApiRequest({
          http,
          workspaceId,
          connection,
          query: statusQuery,
          variables: statusVariables,
        });

        if (!statusData.boards || statusData.boards.length === 0) {
          return [];
        }

        const options: { label: string; value: string }[] = [];
        const columns = statusData.boards[0].columns;

        for (const column of columns) {
          const settings = JSON.parse(column.settings_str);
          if (settings && settings.labels) {
            for (const index in settings.labels) {
              const label = settings.labels[index];
              options.push({
                label: `${column.title}: ${label}`,
                value: `${column.id}|${label}`,
              });
            }
          }
        }
        return options;
      },
    }),
  ],
  aiSchema: z.object({
    itemId: z.string().describe('The ID of the item to update'),
    status: z
      .string()
      .describe(
        'The new status to set, in the format "statusColumnId|statusValue"',
      ),
  }),
  run: async ({ configValue, http, workspaceId, connection }) => {
    const { itemId, status } = configValue;
    const [statusColumnId, statusValue] = status.split('|');

    const itemQuery = `query($itemIds: [ID!]) { items(ids: $itemIds) { board { id } } }`;
    const itemVariables = { itemIds: [Number(itemId)] };
    const itemData = await shared.mondayApiRequest({
      http,
      workspaceId,
      connection,
      query: itemQuery,
      variables: itemVariables,
    });

    if (
      !itemData.items ||
      itemData.items.length === 0 ||
      !itemData.items[0].board
    ) {
      throw new Error(`Item with ID "${itemId}" not found.`);
    }
    const boardId = itemData.items[0].board.id;

    const query = `
      mutation ($itemId: ID!, $boardId: ID!, $columnId: String!, $value: JSON!) {
        change_column_value (
          item_id: $itemId,
          board_id: $boardId,
          column_id: $columnId,
          value: $value
        ) {
          id
        }
      }
    `;

    const variables = {
      itemId: Number(itemId),
      boardId: Number(boardId),
      columnId: statusColumnId,
      value: JSON.stringify({ label: statusValue }),
    };

    const data = await shared.mondayApiRequest({
      http,
      workspaceId,
      connection,
      query,
      variables,
    });

    return {
      success: true,
      itemId: data.change_column_value.id,
      message: `Successfully updated item status to "${statusValue}"`,
    };
  },
  mockRun: async () => {
    return {
      success: true,
      itemId: '123',
      message: 'Successfully updated item status to "Done"',
    };
  },
}); 