import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const retrieveContact = createAction({
  id: 'hubspot_action_retrieve-contact',
  name: 'Retrieve Contact',
  description: 'Retrieves a contact from HubSpot by email',
  inputConfig: [
    createTextInputField({
      id: 'email',
      label: 'Email',
      description: 'The email address of the contact to retrieve',
      placeholder: 'Enter an email address',
      required: {
        missingMessage: 'Email is required',
        missingStatus: 'warning',
      },
    }),
  ],
  aiSchema: z.object({
    email: z
      .string()
      .email()
      .describe('The email address of the contact to retrieve'),
  }),
  run: async ({ configValue, connection, workspaceId, http }) => {
    const { email } = configValue;
    
    // Use only the email endpoint
    const url = `https://api.hubapi.com/contacts/v1/contact/email/${encodeURIComponent(email)}/profile`;

    const result = await http.request({
      method: 'GET',
      url,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
      workspaceId,
    });
    
    if (result?.data) {
      return result.data;
    } else {
      throw new Error('Contact not found');
    }
  },
  mockRun: async () => {
    return {
      vid: 123,
      'canonical-vid': 123,
      'merged-vids': [],
      'portal-id': 123,
      properties: {
        firstname: { value: 'John' },
        lastname: { value: 'Doe' },
        email: { value: 'test@test.com' },
        company: { value: 'Acme' },
        phone: { value: '123-456-7890' },
      },
    };
  },
});