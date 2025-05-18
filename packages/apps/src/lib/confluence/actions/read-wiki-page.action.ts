import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

import { shared } from '../shared/confluence.shared';

export const readWikiPage = createAction({
  id: 'confluence_action_read-wiki-page',
  name: 'Read Wiki Page',
  description: 'Reads the content of a Confluence wiki page by its ID.',
  inputConfig: [
    createTextInputField({
      id: 'pageId',
      label: 'Page ID',
      description: 'The ID of the Confluence page to read.',
      placeholder: 'Enter the page ID',
      required: {
        missingMessage: 'Page ID is required',
        missingStatus: 'warning',
      },
    }),
    createTextInputField({
      id: 'siteUrl',
      label: 'Site URL',
      description: 'Your Confluence site URL (e.g. https://your-domain.atlassian.net)',
      placeholder: 'https://your-domain.atlassian.net',
      required: {
        missingMessage: 'Site URL is required',
        missingStatus: 'warning',
      },
    }),
  ],
  aiSchema: z.object({
    pageId: z.string().describe('The ID of the Confluence page to read'),
    siteUrl: z.string().describe('The Confluence site URL'),
  }),
  run: async ({ configValue, connection }) => {
    const { apiKey } = connection;
    const { pageId, siteUrl } = configValue;

    const res = await shared.confluenceApiRequest({
      apiKey,
      siteUrl,
      method: 'GET',
      url: `/wiki/rest/api/content/${pageId}`,
      params: {
        expand: 'body.storage,version,space',
      },
    });

    const page = res.data;

    return {
      id: page.id,
      title: page.title,
      body: page.body?.storage?.value,
      version: page.version?.number,
      space: page.space?.key,
      url: `${siteUrl}/wiki/spaces/${page.space?.key}/pages/${page.id}`,
    };
  },
  mockRun: async () => {
    return {
      id: '123456',
      title: 'Sample Page',
      body: '<p>This is a sample Confluence page.</p>',
      version: 1,
      space: 'SPACEKEY',
      url: 'https://your-domain.atlassian.net/wiki/spaces/SPACEKEY/pages/123456',
    };
  },
}); 