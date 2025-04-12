import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

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

    // Try using the CRM API instead of the older contacts API
    let url;
    
    if (identifier.includes('@')) {
      // If identifier is an email, use the search endpoint
      url = 'https://api.hubapi.com/crm/v3/objects/contacts/search';
      
      const searchBody = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'email',
                operator: 'EQ',
                value: identifier
              }
            ]
          }
        ],
        properties: ['firstname', 'lastname', 'email', 'company', 'phone']
      };
      
      const result = await http.request({
        method: 'POST',  // Using POST instead of GET
        url,
        data: searchBody,
        headers: {
          Authorization: `Bearer ${connection.accessToken}`,
          'Content-Type': 'application/json'
        },
        workspaceId,
      });
      
      if (result?.data?.results && result.data.results.length > 0) {
        // Transform the response to match the expected format
        const contact = result.data.results[0];
        return {
          vid: contact.id,
          'canonical-vid': contact.id,
          'portal-id': contact.properties.hs_object_id,
          properties: Object.entries(contact.properties).reduce((acc, [key, value]) => {
            acc[key] = { value };
            return acc;
          }, {})
        };
      } else {
        throw new Error('Contact not found');
      }
    } else {
      // If identifier is a contact ID (VID), use the get by ID endpoint
      url = `https://api.hubapi.com/crm/v3/objects/contacts/${identifier}`;
      
      const result = await http.request({
        method: 'GET',
        url,
        params: {
          properties: 'firstname,lastname,email,company,phone'
        },
        headers: {
          Authorization: `Bearer ${connection.accessToken}`
        },
        workspaceId,
      });
      
      if (result?.data?.id) {
        // Transform the response to match the expected format
        const contact = result.data;
        return {
          vid: contact.id,
          'canonical-vid': contact.id,
          'portal-id': contact.properties.hs_object_id,
          properties: Object.entries(contact.properties).reduce((acc, [key, value]) => {
            acc[key] = { value };
            return acc;
          }, {})
        };
      } else {
        throw new Error('Contact not found');
      }
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
