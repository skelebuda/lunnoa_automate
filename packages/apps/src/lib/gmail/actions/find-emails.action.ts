import { createAction, parseNumberOrThrow } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

import { shared } from '../shared/gmail.shared';

export const findEmails = createAction({
  id: 'gmail_action_find-email',
  name: 'Find Emails',
  description: 'Find emails in Gmail using a query string',
  inputConfig: [
    {
      label: 'Search Query',
      id: 'query',
      inputType: 'text',
      placeholder: 'Enter search query',
      description:
        'Behaves like the search bar in your gmail search. Try filters like "from:john@example.com", "subject:hello", "subject:meeting", "label:inbox", "keyword:party", etc.',
      required: {
        missingMessage: 'Search query is required',
        missingStatus: 'warning',
      },
    },
    {
      id: 'includeBody',
      label: 'Include Email Body',
      inputType: 'switch',
      switchOptions: {
        checked: 'true',
        unchecked: 'false',
        defaultChecked: true,
      },
      description:
        'If disabled the body of the email will not be returned. This is useful for reducing the amount of data being loaded if used by an AI Agent.',
    },
    {
      label: 'HTML or Text',
      id: 'htmlOrText',
      inputType: 'select',
      defaultValue: 'text',
      selectOptions: [
        { value: 'html', label: 'HTML' },
        { value: 'text', label: 'Text' },
        { value: 'both', label: 'Both' },
      ],
      loadOptions: {
        dependsOn: [
          {
            id: 'includeBody',
            value: 'true',
          },
        ],
      },
      description:
        'Choose whether to return the email as HTML, text, or both. Not every email will have both HTML and text versions.',
    },
    {
      label: 'Max Results',
      id: 'maxResults',
      inputType: 'number',
      defaultValue: '10',
      placeholder: 'Add max results',
      description: 'The maximum number of messages to return',
    },
  ],
  aiSchema: z.object({
    query: z
      .string()
      .nonempty()
      .describe('The search query string to filter emails.'),
    maxResults: z
      .number()
      .min(1)
      .max(10)
      .nullable()
      .optional()
      .describe('The maximum number of messages to return'),
    includeBody: z
      .enum(['true', 'false'])
      .default('true')
      .describe('Choose whether to return the email as HTML, text, or both'),
    htmlOrText: z
      .enum(['html', 'text', 'both'])
      .describe('Choose whether to return the email as HTML, text, or both'),
  }),
  run: async ({ configValue, connection }) => {
    const gmail = shared.gmail({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
    });

    const response = await gmail.users.messages.list({
      userId: 'me',
      q: configValue.query,
      maxResults: parseNumberOrThrow({
        value: configValue.maxResults,
        propertyName: 'Max results',
      }),
    });

    const messages = await Promise.all(
      (response.data.messages || []).map(async (message) => {
        const messageResponse = await gmail.users.messages.get({
          userId: 'me',
          id: message.id,
        });

        return shared.parseEmail(messageResponse, {
          htmlOrText: configValue.htmlOrText,
          includeBody: configValue.includeBody !== 'false',
        });
      }),
    );

    return messages;
  },
  mockRun: async () => {
    return [shared.mockEmail];
  },
});
