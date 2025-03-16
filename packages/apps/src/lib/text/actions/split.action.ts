import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const split = createAction({
  id: 'text_action_split',
  name: 'Split',
  description: 'Splits text be a delimiter',
  iconUrl: `https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/text.svg`,
  viewOptions: {
    saveButtonOptions: {
      replaceSaveAndTestButton: {
        label: 'Save & Test',
        type: 'real',
      },
    },
  },
  aiSchema: z.object({
    text: z.string().describe('String to split'),
    delimiter: z.string(),
  }),
  inputConfig: [
    createTextInputField({
      id: 'text',
      label: 'Text',
      description: '',
      required: {
        missingMessage: 'Text is required',
        missingStatus: 'warning',
      },
    }),
    createTextInputField({
      id: 'delimiter',
      label: 'Delimiter',
      description: 'This is the sequence of characters to split the text by.',
      placeholder: 'Add delimiter',
    }),
  ],
  run: async ({ configValue }) => {
    const { text, delimiter } = configValue;
    return { result: text.split(delimiter) };
  },
  mockRun: async () => {
    return { result: ['text1', 'test2', 'text3'] };
  },
});
