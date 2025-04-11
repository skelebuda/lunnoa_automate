import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

import { shared } from '../shared/hubspot.shared';

export const retrieveContact = createAction({
  id: 'hubspot_action_retrieve-contact',
  name: 'Retrieve Contact',
  description: 'Retrieves a contact from HubSpot by email or ID',
  inputConfig: [
    createTextInputField({
      id: 'identifier',
      label: 'Contact Identifier',
      description: 'The email address or contact ID to retrieve',
      placeholder: 'Enter an email or contact ID',
      required: {
        missingMessage: 'Identifier is required',
        missingStatus: 'warning',
      },
    }),
  ],
  aiSchema: z.object({
    identifier: z
      .string()
      .describe('The email address or contact ID to retrieve'),
  }),
  run: async ({ configValue, connection, workspaceId, http }) => {
    const { identifier } = configValue;

    let url = '';
    if (identifier.includes('@')) {
      // If identifier is an email
      url = `https://api.hubapi.com/contacts/v1/contact/email/${encodeURIComponent(identifier)}/profile`;
    } else {
      // If identifier is a contact ID (VID)
      url = `https://api.hubapi.com/contacts/v1/contact/vid/${encodeURIComponent(identifier)}/profile`;
    }

    const result = await http.request({
      method: 'GET',
      url,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
      workspaceId,
    });

    if (result?.data?.vid) {
      return result.data;
    } else {
      throw new Error(`Failed to retrieve contact: ${result?.data?.message || 'Contact not found'}`);
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
