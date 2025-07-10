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
      id: 'statusColumnId',
      label: 'Status Column',
      description: 'The status column to update.',
      required: {
        missingMessage: 'Status column is required.',
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
        try {
          const itemId = extraOptions?.itemId as string;
          if (!itemId || isNaN(Number(itemId))) {
            return [];
          }

          const query = `query($itemIds: [ID!]) {
            items(ids: $itemIds) {
              board {
                columns(types: [status]) {
                  id
                  title
                }
              }
            }
          }`;

          const variables = { itemIds: [Number(itemId)] };

          const data = await shared.mondayApiRequest({
            http,
            workspaceId,
            connection,
            query,
            variables,
          });

          if (
            !data.items ||
            data.items.length === 0 ||
            !data.items[0].board ||
            !data.items[0].board.columns
          ) {
            throw new Error(
              `Could not find status columns for Item ID: ${itemId}. Please check the ID and your permissions.`,
            );
          }

          return data.items[0].board.columns.map(
            (column: { id: string; title: string }) => ({
              label: column.title,
              value: column.id,
            }),
          );
        } catch (error) {
          throw new Error(`Failed to load status columns: ${error.message}`);
        }
      },
    }),
    createDynamicSelectInputField({
      id: 'statusValue',
      label: 'New Status',
      description: 'The new status to set.',
      required: {
        missingMessage: 'New status is required.',
        missingStatus: 'error',
      },
      loadOptions: {
        dependsOn: ['itemId', 'statusColumnId'],
      },
      _getDynamicValues: async ({
        http,
        workspaceId,
        connection,
        extraOptions,
      }) => {
        const itemId = extraOptions?.itemId as string;
        const statusColumnId = extraOptions?.statusColumnId as string;
        if (!itemId || isNaN(Number(itemId)) || !statusColumnId) {
          return [];
        }

        const query = `query($itemIds: [ID!]) {
          items(ids: $itemIds) {
            board {
              columns(ids: ["${statusColumnId}"]) {
                settings_str
              }
            }
          }
        }`;
        const variables = { itemIds: [Number(itemId)] };

        const data = await shared.mondayApiRequest({
          http,
          workspaceId,
          connection,
          query,
          variables,
        });

        if (
          !data.items ||
          data.items.length === 0 ||
          !data.items[0].board ||
          !data.items[0].board.columns ||
          data.items[0].board.columns.length === 0
        ) {
          return [];
        }

        const settings = JSON.parse(
          data.items[0].board.columns[0].settings_str,
        );
        if (settings && settings.labels) {
          return Object.values(settings.labels).map((label: any) => ({
            label,
            value: label,
          }));
        }

        return [];
      },
    }),
  ],
  aiSchema: z.object({
    itemId: z.string().describe('The ID of the item to update'),
    statusColumnId: z.string().describe('The ID of the status column to update'),
    statusValue: z.string().describe('The new status to set'),
  }),
  run: async ({ configValue, http, workspaceId, connection }) => {
    const { itemId, statusColumnId, statusValue } = configValue;

    const itemQuery = `query($itemIds: [ID!]) { items(ids: $itemIds) { board { id column_values(ids: ["${statusColumnId}"]) { id settings_str } } } }`;
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
    const column = itemData.items[0].board.column_values.find(
      (c: { id: string }) => c.id === statusColumnId,
    );

    if (!column) {
      throw new Error(`Status column with ID "${statusColumnId}" not found.`);
    }

    const settings = JSON.parse(column.settings_str);
    const statusIndex = Object.keys(settings.labels).find(
      (key) => settings.labels[key] === statusValue,
    );

    if (!statusIndex) {
      throw new Error(`Status with label "${statusValue}" not found.`);
    }

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
      value: JSON.stringify({ index: parseInt(statusIndex, 10) }),
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