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
      const searchContactUrl = `https://api.hubapi.com/crm/v3/objects/contacts/search`;
      
      const contactSearchResult = await http.request({
        method: 'POST',
        url: searchContactUrl,
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
          properties: ['email'],
          limit: 1
        },
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json'
        },
        workspaceId,
      });
      
      if (!contactSearchResult?.data?.results || contactSearchResult.data.results.length === 0) {
        throw new Error(`Contact with email ${email} not found`);
      }
      
      const contactId = contactSearchResult.data.results[0].id;
      console.log(`[HUBSPOT DEBUG] Found contact with ID: ${contactId}`);
      
      // Step 2: Find all notes associated with this contact
      const associationsUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/notes`;
      
      const associationsResult = await http.request({
        method: 'GET',
        url: associationsUrl,
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
        workspaceId,
      });
      
      if (!associationsResult?.data?.results || associationsResult.data.results.length === 0) {
        console.log(`[HUBSPOT DEBUG] No notes found for contact with ID: ${contactId}`);
        return { 
          contactId,
          email,
          notes: [] 
        };
      }
      
      // Extract note IDs from associations
      const noteIds = associationsResult.data.results.map(result => result.id);
      console.log(`[HUBSPOT DEBUG] Found ${noteIds.length} notes for contact`);
      
      // Step 3: Batch read the notes
      if (noteIds.length === 0) {
        return { 
          contactId,
          email,
          notes: [] 
        };
      }
      
      const batchReadUrl = `https://api.hubapi.com/crm/v3/objects/notes/batch/read`;
      
      const batchReadResult = await http.request({
        method: 'POST',
        url: batchReadUrl,
        data: {
          inputs: noteIds.map(id => ({ id })),
          properties: ['hs_note_body', 'hs_createdate', 'hs_lastmodifieddate']
        },
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json'
        },
        workspaceId,
      });
      
      if (!batchReadResult?.data?.results) {
        throw new Error('Failed to retrieve notes details');
      }
      
      // Return the contact ID, email, and all notes
      return {
        contactId,
        email,
        notes: batchReadResult.data.results
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