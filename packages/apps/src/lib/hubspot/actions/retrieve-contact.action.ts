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

    // Determine which endpoint to use based on identifier format
    let url;
    if (identifier.includes('@')) {
      // If identifier is an email, use the email endpoint
      url = `https://api.hubapi.com/contacts/v1/contact/email/${encodeURIComponent(identifier)}/profile`;
    } else {
      // If identifier is a contact ID (VID), use the VID endpoint
      url = `https://api.hubapi.com/contacts/v1/contact/vid/${encodeURIComponent(identifier)}/profile`;
    }

    // Use the shared request wrapper with token refresh
    const result = await shared.makeRequestWithTokenRefresh({
      connection,
      workspaceId,
      http,
      requestConfig: {
        method: 'GET',
        url,
        headers: {
          'Content-Type': 'application/json',
        },
      },
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
