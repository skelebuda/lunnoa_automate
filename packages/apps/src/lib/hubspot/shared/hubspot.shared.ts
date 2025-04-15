import {
  createDynamicSelectInputField,
  createNestedFields,
  createTextInputField,
} from '@lunnoa-automate/toolkit';

export const shared = {
  fields: {
    dynamicGetContactProperties: createNestedFields({
      id: 'properties',
      label: 'Properties',
      description: 'Key-value pairs representing fields and their values',
      occurenceType: 'multiple',
      fields: [
        createDynamicSelectInputField({
          id: 'field',
          label: 'Field',
          description: '',
          _getDynamicValues: async ({ connection, workspaceId, http }) => {
            const url = 'https://api.hubapi.com/crm/v3/properties/contacts';

            const response = await http.request({
              method: 'GET',
              url,
              headers: {
                Authorization: `Bearer ${connection.accessToken}`,
              },
              workspaceId,
            });

            return response.data.results
              .filter(
                (field: any) =>
                  field.modificationMetadata?.readOnlyValue != true,
              )
              .map((field: any) => {
                const fieldLabel = field.label.replace(/"/g, '_');
                const fieldName = field.name;

                return {
                  label: fieldLabel,
                  value: fieldName,
                };
              });
          },
          required: {
            missingMessage: 'Field is required',
            missingStatus: 'warning',
          },
        }),
        createTextInputField({
          id: 'value',
          label: 'Value',
          description: '',
          placeholder: 'Add a value',
          required: {
            missingMessage: 'Value is required',
            missingStatus: 'warning',
          },
        }),
      ],
    }),
    dynamicGetStaticContactLists: createDynamicSelectInputField({
      id: 'listId',
      label: 'List',
      description: 'The ID of the list to add the contact to',
      placeholder: 'Select a static list',
      _getDynamicValues: async ({ connection, workspaceId, http }) => {
        const url = `https://api.hubapi.com/contacts/v1/lists`;

        const response = await http.request({
          method: 'GET',
          url,
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
          workspaceId,
        });

        return response.data.lists
          .filter(
            (list: any) =>
              list.dynamic === false &&
              list.archived === false &&
              list.readOnly === false,
          )
          .map((list: any) => ({
            label: list.name,
            value: list.listId,
          }));
      },
      required: {
        missingMessage: 'List ID is required',
        missingStatus: 'warning',
      },
    }),
  },
  
  // Add a token refresh utility
  refreshToken: async ({ connection, workspaceId, http }) => {
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
          client_id: process.env.HUBSPOT_CLIENT_ID || process.env.INTEGRATION_HUBSPOT_CLIENT_ID,
          client_secret: process.env.HUBSPOT_CLIENT_SECRET || process.env.INTEGRATION_HUBSPOT_CLIENT_SECRET,
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
  },
  
  // Add a request wrapper that handles token refresh
  makeRequestWithTokenRefresh: async ({ 
    connection, 
    workspaceId, 
    http, 
    requestConfig 
  }) => {
    try {
      // First attempt with current access token
      const result = await http.request({
        ...requestConfig,
        headers: {
          ...requestConfig.headers,
          Authorization: `Bearer ${connection.accessToken}`,
        },
        workspaceId,
      });
      
      return result;
    } catch (error) {
      // Check if error is due to token expiration (status 401)
      if (error.response?.status === 401) {
        try {
          // Refresh the token
          const newAccessToken = await shared.refreshToken({ connection, workspaceId, http });
          
          // Retry the request with the new token
          const retryResult = await http.request({
            ...requestConfig,
            headers: {
              ...requestConfig.headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
            workspaceId,
          });
          
          return retryResult;
        } catch (refreshError) {
          // If token refresh fails, throw a clear error
          throw new Error('Authentication failed. Please reconnect your HubSpot account.');
        }
      }
      
      // For other errors, throw the original error
      throw error;
    }
  }
};