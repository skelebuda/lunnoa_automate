import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

import { shared } from '../shared/hubspot.shared';

export const updateContact = createAction({
  id: 'hubspot_action_update-contact',
  name: 'Update Contact',
  description: 'Updates an existing contact in Hubspot',
  inputConfig: [
    createTextInputField({
      id: 'identifier',
      label: 'Contact Email',
      description: 'The unique identifier of the contact (e.g., email or VID)',
      placeholder: 'Enter a contact email or VID',
      required: {
        missingMessage: 'Please provide an identifier',
        missingStatus: 'warning',
      },
    }),
    shared.fields.dynamicGetContactProperties,
  ],
  aiSchema: z.object({
    identifier: z
      .string()
      .describe(
        'The unique identifier of the contact (e.g., email or contact ID)',
      ),
    properties: z
      .array(
        z.object({
          field: z.string().describe('The field to update'),
          value: z.string().describe('The value to update'),
        }),
      )
      .describe('The field and value for the field to update'),
  }),
  run: async ({ configValue, connection, workspaceId, http }) => {
    const { identifier, properties } = configValue;

    let url = '';
    if (identifier.includes('@')) {
      url = `https://api.hubapi.com/contacts/v1/contact/email/${encodeURIComponent(identifier)}/profile`;
    } else {
      url = `https://api.hubapi.com/contacts/v1/contact/vid/${encodeURIComponent(identifier)}/profile`;
    }

    const data = {
      properties: properties.map(({ field, value }) => ({
        property: field,
        value,
      })),
    };

    try {
      const result = await http.request({
        method: 'POST',
        url,
        data,
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
        },
        workspaceId,
      });
      
      // HubSpot might not return data even on successful updates
      // So we'll consider it a success unless there's a specific error
      return {
        updated: true,
        message: 'Contact updated successfully',
      };
    } catch (error) {
      // Check if it's a token expiration error
      if (error.response?.status === 401) {
        throw new Error('Your HubSpot authentication has expired. Please reconnect your account.');
      }
      
      // For other errors, provide more details if available
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error';
      throw new Error(`Failed to update contact: ${errorMessage}`);
    }
  },
  mockRun: async () => {
    return {
      updated: true,
    };
  },
});
