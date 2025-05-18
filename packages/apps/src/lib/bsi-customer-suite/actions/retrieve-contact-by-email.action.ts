import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const retrieveContactByEmail = createAction({
  id: 'hubspot_action_retrieve-contact-by-email',
  name: 'Retrieve Contact by Email (v3)',
  description: 'Retrieves a contact from HubSpot by email using the v3 API',
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
    
    // Using v3 API - search endpoint to find contact by email
    const url = `https://api.hubapi.com/crm/v3/objects/contacts/search`;

    try {
      console.log(`[HUBSPOT DEBUG] Making search request to ${url} with token ${connection.accessToken?.substring(0, 10)}...`);
      const result = await http.request({
        method: 'POST',
        url,
        data: {
          filterGroups: [
            {
              filters: [
                {
                  propertyName: 'email',
                  operator: 'EQ',
                  value: email
                }
              ]
            }
          ],
          properties: ['firstname', 'lastname', 'email', 'company', 'phone'],
          limit: 1
        },
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json'
        },
        workspaceId,
      });
      
      console.log(`[HUBSPOT DEBUG] Request successful`);
      if (result?.data?.results && result.data.results.length > 0) {
        return result.data.results[0];
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
      throw error;
    }
  },
  mockRun: async () => {
    return {
      id: '123',
      properties: {
        firstname: 'John',
        lastname: 'Doe',
        email: 'test@test.com',
        company: 'Acme',
        phone: '123-456-7890'
      },
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z'
    };
  },
}); 