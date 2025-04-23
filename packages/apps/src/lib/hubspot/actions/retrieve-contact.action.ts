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

    try {
      console.log(`[HUBSPOT DEBUG] Making request to ${url} with token ${connection.accessToken?.substring(0, 10)}...`);
      const result = await http.request({
        method: 'GET',
        url,
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
        workspaceId,
      });
      
      console.log(`[HUBSPOT DEBUG] Request successful`);
      if (result?.data) {
        return result.data;
      } else {
        throw new Error('Contact not found');
      }
    } catch (error) {
      console.log(`[HUBSPOT DEBUG] Request failed:`, {
        message: error.message,
        status: error?.status,
        responseStatus: error?.response?.status,
        responseData: JSON.stringify(error?.response?.data)
      });
      throw error; // Make sure to re-throw the error to trigger token refresh
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