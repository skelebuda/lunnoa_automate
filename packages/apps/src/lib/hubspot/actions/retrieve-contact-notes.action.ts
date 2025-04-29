import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const retrieveContactNotes = createAction({
  id: 'hubspot_action_retrieve-contact-notes',
  name: 'Retrieve Contact Notes',
  description: 'Retrieves all notes associated with a contact by email',
  inputConfig: [
    createTextInputField({
      id: 'email',
      label: 'Email',
      description: 'The email address of the contact to retrieve notes for',
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
      .describe('The email address of the contact to retrieve notes for'),
  }),
  run: async ({ configValue, connection, workspaceId, http }) => {
    const { email } = configValue;
    
    try {
      // Step 1: First find the contact by email to get the contact ID
      console.log(`[HUBSPOT DEBUG] Searching for contact with email: ${email}`);
      const contactUrl = `https://api.hubapi.com/contacts/v1/contact/email/${encodeURIComponent(email)}/profile`;
      
      const contactResult = await http.request({
        method: 'GET',
        url: contactUrl,
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
        workspaceId,
      });
      
      if (!contactResult?.data?.vid) {
        throw new Error(`Contact with email ${email} not found`);
      }
      
      const contactId = contactResult.data.vid;
      console.log(`[HUBSPOT DEBUG] Found contact with ID: ${contactId}`);
      
      // Step 2: Get all engagements (including notes) for this contact
      const engagementsUrl = `https://api.hubapi.com/engagements/v1/engagements/associated/contact/${contactId}/paged`;
      
      const engagementsResult = await http.request({
        method: 'GET',
        url: engagementsUrl,
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
        workspaceId,
      });
      
      if (!engagementsResult?.data?.results) {
        console.log(`[HUBSPOT DEBUG] No engagements found for contact with ID: ${contactId}`);
        return { 
          contactId,
          email,
          notes: [] 
        };
      }
      
      // Filter only the notes from all engagements
      const notes = engagementsResult.data.results
        .filter(engagement => engagement.engagement.type === 'NOTE')
        .map(engagement => {
          return {
            id: engagement.engagement.id,
            properties: {
              hs_note_body: engagement.engagement.bodyPreview || engagement.metadata.body || '',
              hs_createdate: engagement.engagement.createdAt,
              hs_lastmodifieddate: engagement.engagement.lastUpdated
            },
            createdAt: new Date(engagement.engagement.createdAt).toISOString(),
            updatedAt: new Date(engagement.engagement.lastUpdated).toISOString()
          };
        });
      
      console.log(`[HUBSPOT DEBUG] Found ${notes.length} notes for contact`);
      
      // Return the contact ID, email, and all notes
      return {
        contactId,
        email,
        notes
      };
      
    } catch (error) {
      console.log(`[HUBSPOT DEBUG] Request failed:`, {
        message: error.message,
        status: error?.status,
        responseStatus: error?.response?.status,
        responseData: JSON.stringify(error?.response?.data)
      });
      
      // Check if it's a token expiration error
      if (error.response?.status === 401) {
        throw new Error('Your HubSpot authentication has expired. Please reconnect your account.');
      }
      
      // For other errors, provide more details if available
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`Failed to retrieve contact notes: ${errorMessage}`);
    }
  },
  mockRun: async () => {
    return {
      contactId: '123',
      email: 'test@example.com',
      notes: [
        {
          id: '456',
          properties: {
            hs_note_body: 'This is a test note for the contact',
            hs_createdate: '2023-01-01T12:00:00.000Z',
            hs_lastmodifieddate: '2023-01-01T12:00:00.000Z'
          },
          createdAt: '2023-01-01T12:00:00.000Z',
          updatedAt: '2023-01-01T12:00:00.000Z'
        },
        {
          id: '789',
          properties: {
            hs_note_body: 'Another note with important information',
            hs_createdate: '2023-01-02T14:30:00.000Z',
            hs_lastmodifieddate: '2023-01-02T14:30:00.000Z'
          },
          createdAt: '2023-01-02T14:30:00.000Z',
          updatedAt: '2023-01-02T14:30:00.000Z'
        }
      ]
    };
  },
});