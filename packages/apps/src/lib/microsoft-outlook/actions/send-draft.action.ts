import { createAction, createDynamicSelectInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const sendDraft = createAction({
  id: 'microsoft-outlook_action_send-draft',
  name: 'Send Draft',
  description: 'Send a draft from Outlook',
  aiSchema: z.object({
    draftId: z.string().describe('The ID of the draft to send'),
  }),
  inputConfig: [
    createDynamicSelectInputField({
      id: 'draftId',
      label: 'Draft',
      description: 'The draft to send',
      _getDynamicValues: async ({ connection, workspaceId, http }) => {
        const url =
          'https://graph.microsoft.com/v1.0/me/mailFolders/drafts/messages';

        const drafts = await http.request({
          method: 'GET',
          url,
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
          workspaceId,
        });

        return drafts.data.value.map((draft: any) => ({
          label: !draft.subject ? 'No Subject' : draft.subject,
          value: draft.id,
        }));
      },
    }),
  ],
  run: async ({ configValue, connection, workspaceId, http }) => {
    const url = `https://graph.microsoft.com/v1.0/me/messages/${configValue.draftId}/send`;

    const sendDraftResult = await http.request({
      method: 'POST',
      url,
      data: {},
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
      workspaceId,
    });

    return sendDraftResult.data;
  },
  mockRun: async () => {
    return {};
  },
});
