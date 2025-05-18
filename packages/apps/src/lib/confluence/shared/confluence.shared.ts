import { createDynamicSelectInputField } from '@lunnoa-automate/toolkit';
import axios from 'axios';

export const shared = {
  async getCloudApiBaseUrl({ accessToken }: { accessToken: string }) {
    // Get the list of accessible resources (clouds)
    const res = await axios.get('https://api.atlassian.com/oauth/token/accessible-resources', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    // For simplicity, use the first accessible resource
    const cloud = res.data[0];
    return {
      baseUrl: `https://api.atlassian.com/ex/confluence/${cloud.id}`,
      cloudId: cloud.id,
      url: cloud.url,
    };
  },
  async confluenceApiRequest({
    apiKey,
    siteUrl,
    method,
    url,
    params,
    data,
  }: {
    apiKey: string;
    siteUrl: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    url: string;
    params?: any;
    data?: any;
  }) {
    return axios({
      method,
      url: `${siteUrl}${url}`,
      params,
      data,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: 'application/json',
      },
    });
  },
  fields: {
    selectSpaceKeyField: createDynamicSelectInputField({
      id: 'spaceKey',
      label: 'Space',
      description: 'Select a Confluence space',
      placeholder: 'Select a space',
      _getDynamicValues: async ({ connection, extraOptions }) => {
        const { apiKey } = connection;
        const { siteUrl } = extraOptions;

        if (!siteUrl) {
          // siteUrl must be provided in the form before this field loads
          return [];
        }

        const res = await axios.get(`${siteUrl}/wiki/rest/api/space`, {
          headers: {
            Authorization: `Bearer ${apiKey}`,
            Accept: 'application/json',
          },
          params: {
            limit: 100, // adjust as needed
          },
        });

        return (
          res.data.results?.map((space: any) => ({
            label: `${space.name} (${space.key})`,
            value: space.key,
          })) ?? []
        );
      },
      required: {
        missingMessage: 'Space is required',
        missingStatus: 'warning',
      },
      loadOptions: {
        dependsOn: ['siteUrl'],
      },
    }),
    // ...add more shared fields here as needed
  },
}; 