import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const deleteFirstItem = createAction({
  id: 'list_action_delete-first-item',
  name: 'Delete First Item in List',
  description: 'Removes the first item from a list and returns the modified list',
  iconUrl: `https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/list.svg`,
  viewOptions: {
    saveButtonOptions: {
      replaceSaveAndTestButton: {
        label: 'Save & Test',
        type: 'real',
      },
    },
  },
  inputConfig: [
    createTextInputField({
      id: 'listOfItems',
      label: 'List',
      description:
        'Provide a list of items, and this action will remove the first item and return the modified list.',
      required: {
        missingMessage: 'List is required',
        missingStatus: 'warning',
      },
    }),
  ],
  aiSchema: z.object({
    listOfItems: z
      .array(z.any())
      .describe('The list of items from which to delete the first item'),
  }),
  run: async ({ configValue }) => {
    const { listOfItems } = configValue;

    let list;
    if (typeof listOfItems === 'string') {
      try {
        list = JSON.parse(listOfItems);
        if (!Array.isArray(list)) {
          throw new Error('List must be a valid JSON array');
        }
      } catch {
        throw new Error('List must be a valid stringified JSON array');
      }
    } else if (Array.isArray(listOfItems)) {
      list = listOfItems;
    } else {
      throw new Error(
        'List must be a valid stringified JSON array or an array of values',
      );
    }

    const deletedItem = list.length > 0 ? list[0] : null;
    const modifiedList = list.length > 0 ? list.slice(1) : [];

    return { 
      result: modifiedList,
      deletedItem: deletedItem 
    };
  },
  mockRun: async () => {
    return { 
      result: ['b', 'c', 'd', 'e', 'f'],
      deletedItem: 'a'
    };
  },
}); 