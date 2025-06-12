import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';
import { shared } from '../shared/monday.shared';

export const updateItemStatus = createAction({
  id: 'monday_action_update-item-status',
  name: 'Update Item Status',
  description: "Update the status of a specific item on a Monday.com board.",
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
    createTextInputField({
      id: 'statusColumnId',
      label: 'Status Column ID',
      description: 'The ID of the status column to update',
      required: {
        missingMessage: 'Status Column ID is required',
        missingStatus: 'error',
      },
    }),
    createTextInputField({
      id: 'statusValue',
      label: 'New Status',
      description: 'The new status value to set (e.g., "Done", "Working on it", "Stuck")',
      required: {
        missingMessage: 'New status value is required',
        missingStatus: 'error',
      },
    }),
  ],
  aiSchema: z.object({
    itemId: z.string().describe('The ID of the item to update'),
    statusColumnId: z.string().describe('The ID of the status column to update'),
    statusValue: z.string().describe('The new status value to set (e.g., "Done", "Working on it", "Stuck")'),
  }),
  run: async ({ configValue, http, workspaceId, connection }) => {
    const { itemId, statusColumnId, statusValue } = configValue;

    const query = `
      mutation ($itemId: ID!, $columnId: String!, $value: JSON!) {
        change_column_value (
          item_id: $itemId,
          column_id: $columnId,
          value: $value
        ) {
          id
        }
      }
    `;

    const variables = {
      itemId: Number(itemId),
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
      message: `Successfully updated item status to "${statusValue}"`
    };
  },
  mockRun: async () => {
    return {
      success: true,
      itemId: '123',
      message: 'Successfully updated item status to "Done"'
    };
  },
}); 