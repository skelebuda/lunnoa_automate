import {
  createAction,
  createSelectInputField,
  createTextInputField,
} from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const sendEmail = createAction({
  id: 'microsoft-outlook_action_send-email',
  name: 'Send Email',
  description: 'Send an email using Outlook',
  inputConfig: [
    createTextInputField({
      label: 'Recipients',
      id: 'recipientEmails',
      placeholder: 'Add recipient',
      occurenceType: 'multiple',
      description: 'The email address of the recipient(s)',
      required: {
        missingMessage: 'Recipient is required',
        missingStatus: 'warning',
      },
    }),
    createTextInputField({
      label: 'Subject',
      id: 'subject',
      placeholder: 'Add subject',
      description: 'The subject of the email',
      required: {
        missingMessage: 'Subject is required',
        missingStatus: 'warning',
      },
    }),
    createSelectInputField({
      label: 'Content Type',
      id: 'contentType',
      selectOptions: [
        {
          label: 'HTML',
          value: 'HTML',
        },
        {
          label: 'Text',
          value: 'Text',
        },
      ],
      defaultValue: 'Text',
      required: {
        missingMessage: 'Content type is required',
        missingStatus: 'warning',
      },
      description: 'The content type of the email',
    }),
    createTextInputField({
      label: 'Body',
      id: 'body',
      placeholder: 'Add body',
      description: 'The body of the email',
      required: {
        missingMessage: 'Message is required',
        missingStatus: 'warning',
      },
    }),
    createTextInputField({
      label: 'CC Recipients',
      id: 'ccRecipientEmails',
      placeholder: 'Add CC recipient',
      occurenceType: 'multiple',
      description: 'The email address of the recipient(s)',
    }),
  ],
  aiSchema: z.object({
    recipientEmails: z
      .array(z.string())
      .describe('The email address of the recipient(s)'),
    subject: z.string().describe('The subject of the email'),
    contentType: z
      .enum(['HTML', 'Text'])
      .describe('The content type of the email'),
    body: z.string().describe('The body of the email'),
    ccRecipientEmails: z
      .array(z.string())
      .nullable()
      .optional()
      .describe('The email address of the recipient(s)'),
  }),
  run: async ({ configValue, connection, workspaceId, http }) => {
    const url = 'https://graph.microsoft.com/v1.0/me/sendMail';
    const data = {
      message: {
        subject: configValue.subject,
        body: {
          contentType: configValue.contentType,
          content: configValue.body,
        },
        toRecipients:
          configValue?.recipientEmails.map((email) => ({
            emailAddress: {
              address: email,
            },
          })) ?? [],
        ccRecipients:
          configValue?.ccRecipientEmails?.map((email) => ({
            emailAddress: {
              address: email,
            },
          })) ?? [],
      },
      saveToSentItems: 'true',
    };

    await http.request({
      method: 'POST',
      url,
      data,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
      workspaceId,
    });

    return { success: true };
  },
  mockRun: async () => ({
    success: true,
  }),
}); 