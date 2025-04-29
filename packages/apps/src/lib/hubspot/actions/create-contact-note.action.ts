import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const createContactNote = createAction({
  id: 'hubspot_action_create-contact-note',
  name: 'Create Contact Note',
  description: 'Creates a note for a specific contact by email',
  inputConfig: [
    createTextInputField({
      id: 'email',
      label: 'Email',
      description: 'The email address of the contact to create a note for',
      placeholder: 'Enter an email address',
      required: {
        missingMessage: 'Email is required',
        missingStatus: 'warning',
      },
    }),
    createTextInputField({
      id: 'noteContent',
      label: 'Note Content',
      description: 'The content of the note to create',
      placeholder: 'Enter note content',
      required: {
        missingMessage: 'Note content is required',
        missingStatus: 'warning',
      },
    }),
  ],
  aiSchema: z.object({
    email: z
      .string()
      .email()
      .describe('The email address of the contact to create a note for'),
    noteContent: z
      .string()
      .describe('The content of the note to create'),
  }),
  run: async ({ configValue, connection, workspaceId, http }) => {
    const { email, noteContent } = configValue;
    
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
      
      // Step 2: Create the note
      const createNoteUrl = `https://api.hubapi.com/crm/v3/objects/notes`;
      
      const createNoteResult = await http.request({
        method: 'POST',
        url: createNoteUrl,
        data: {
          properties: {
            hs_note_body: noteContent,
          }
        },
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json'
        },
        workspaceId,
      });
      
      if (!createNoteResult?.data?.id) {
        throw new Error('Failed to create note');
      }
      
      const noteId = createNoteResult.data.id;
      console.log(`[HUBSPOT DEBUG] Created note with ID: ${noteId}`);
      
      // Step 3: Associate the note with the contact
      const associateUrl = `https://api.hubapi.com/crm/v3/objects/notes/${noteId}/associations/contacts/${contactId}/note_to_contact`;
      
      const associateResult = await http.request({
        method: 'PUT',
        url: associateUrl,
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
        workspaceId,
      });
      
      console.log(`[HUBSPOT DEBUG] Associated note with contact`);
      
      // Return the created note details
      return {
        success: true,
        contactId,
        email,
        noteId: createNoteResult.data.id,
        note: {
          id: createNoteResult.data.id,
          properties: createNoteResult.data.properties,
          createdAt: createNoteResult.data.createdAt,
          updatedAt: createNoteResult.data.updatedAt
        }
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
      throw new Error(`Failed to create contact note: ${errorMessage}`);
    }
  },
  mockRun: async () => {
    return {
      success: true,
      contactId: '123',
      email: 'test@example.com',
      noteId: '456',
      note: {
        id: '456',
        properties: {
          hs_note_body: 'This is a test note for the contact',
          hs_createdate: '2023-01-01T12:00:00.000Z',
          hs_lastmodifieddate: '2023-01-01T12:00:00.000Z'
        },
        createdAt: '2023-01-01T12:00:00.000Z',
        updatedAt: '2023-01-01T12:00:00.000Z'
      }
    };
  },
}); 