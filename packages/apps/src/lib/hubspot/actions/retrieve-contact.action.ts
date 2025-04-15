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

    // Function to refresh the access token
    const refreshAccessToken = async () => {
      try {
        // Make sure we have the refresh token
        if (!connection.refreshToken) {
          throw new Error('No refresh token available. Please reconnect your HubSpot account.');
        }

        // Prepare the request to refresh the token
        const tokenResponse = await http.request({
          method: 'POST',
          url: 'https://api.hubapi.com/oauth/v1/token',
          data: {
            grant_type: 'refresh_token',
            client_id: process.env.HUBSPOT_CLIENT_ID,
            client_secret: process.env.HUBSPOT_CLIENT_SECRET,
            refresh_token: connection.refreshToken,
          },
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          workspaceId,
        });

        if (tokenResponse?.data?.access_token) {
          // Return the new access token
          return tokenResponse.data.access_token;
        } else {
          throw new Error('Failed to refresh access token');
        }
      } catch (error) {
        console.error('Error refreshing token:', error);
        throw new Error('Failed to refresh authentication token. Please reconnect your HubSpot account.');
      }
    };

    // Function to make a request with token refresh capability
    const makeRequestWithTokenRefresh = async () => {
      // Determine which endpoint to use based on identifier format
      let url;
      if (identifier.includes('@')) {
        // If identifier is an email, use the email endpoint
        url = `https://api.hubapi.com/contacts/v1/contact/email/${encodeURIComponent(identifier)}/profile`;
      } else {
        // If identifier is a contact ID (VID), use the VID endpoint
        url = `https://api.hubapi.com/contacts/v1/contact/vid/${encodeURIComponent(identifier)}/profile`;
      }

      try {
        // First attempt with current access token
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
      } catch (error) {
        // Check if error is due to token expiration (status 401)
        if (error.response?.status === 401) {
          // Refresh the token
          const newAccessToken = await refreshAccessToken();
          
          // Retry the request with the new token
          const retryResult = await http.request({
            method: 'GET',
            url,
            headers: {
              Authorization: `Bearer ${newAccessToken}`,
            },
            workspaceId,
          });
          
          if (retryResult?.data) {
            return retryResult.data;
          } else {
            throw new Error('Contact not found');
          }
        }
        
        // For other errors, throw the original error
        throw error;
      }
    };

    // Execute the request with token refresh capability
    return await makeRequestWithTokenRefresh();
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
