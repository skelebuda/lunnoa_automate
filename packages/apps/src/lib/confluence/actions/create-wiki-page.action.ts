import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';
import { shared } from '../shared/confluence.shared';

export const createWikiPage = createAction({
  id: 'confluence_action_create-wiki-page',
  name: 'Create Wiki Page',
  description: 'Creates a new Confluence wiki page in a given space.',
  inputConfig: [
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
    createTextInputField({
      id: 'spaceKey',
      label: 'Space Key',
      description: 'The key of the space where the page will be created.',
      placeholder: 'SPACEKEY',
      required: {
        missingMessage: 'Space Key is required',
        missingStatus: 'warning',
      },
    }),
    createTextInputField({
      id: 'title',
      label: 'Page Title',
      description: 'The title of the new page.',
      placeholder: 'Page Title',
      required: {
        missingMessage: 'Title is required',
        missingStatus: 'warning',
      },
    }),
    createTextInputField({
      id: 'body',
      label: 'Page Body (HTML)',
      description: 'The content of the page (HTML format).',
      placeholder: '<p>Your content here</p>',
      required: {
        missingMessage: 'Body is required',
        missingStatus: 'warning',
      },
    }),
  ],
  aiSchema: z.object({
    siteUrl: z.string().describe('The Confluence site URL'),
    spaceKey: z.string().describe('The key of the space'),
    title: z.string().describe('The title of the new page'),
    body: z.string().describe('The HTML content of the page'),
  }),
  run: async ({ configValue, connection }) => {
    const { apiKey } = connection;
    const { siteUrl, spaceKey, title, body } = configValue;

    const res = await shared.confluenceApiRequest({
      apiKey,
      siteUrl,
      method: 'POST',
      url: '/wiki/rest/api/content',
      data: {
        type: 'page',
        title,
        space: { key: spaceKey },
        body: {
          storage: {
            value: body,
            representation: 'storage',
          },
        },
      },
    });

    const page = res.data;

    return {
      id: page.id,
      title: page.title,
      url: `${siteUrl}/wiki/spaces/${spaceKey}/pages/${page.id}`,
    };
  },
  mockRun: async () => ({
    id: '654321',
    title: 'Created Page',
    url: 'https://your-domain.atlassian.net/wiki/spaces/SPACEKEY/pages/654321',
  }),
}); 