import { createAction } from '@lunnoa-automate/toolkit';
import { createNumberInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const subtraction = createAction({
  id: 'math_action_subtraction',
  name: 'Subtraction',
  description: 'Subtracts one number from another.',
  iconUrl: `https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/math.svg`,
  viewOptions: {
    saveButtonOptions: {
      replaceSaveAndTestButton: {
        label: 'Save & Test',
        type: 'real',
      },
    },
  },
  inputConfig: [
    createNumberInputField({
      id: 'number1',
      label: 'First Number',
      description: '',
      required: {
        missingMessage: 'First number is required',
        missingStatus: 'warning',
      },
    }),
    createNumberInputField({
      id: 'number2',
      label: 'Second Number',
      description: '',
      required: {
        missingMessage: 'Second number is required',
        missingStatus: 'warning',
      },
    }),
  ],
  aiSchema: z.object({
    number1: z.number(),
    number2: z.number(),
  }),
  run: async ({ configValue }) => {
    const num1 = Number(configValue.number1);
    const num2 = Number(configValue.number2);

    return { result: num1 - num2 };
  },
  mockRun: async () => {
    return { result: 42 };
  },
});
