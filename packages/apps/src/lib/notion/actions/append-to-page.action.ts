import { createAction, createTextInputField } from '@lecca-io/toolkit';
import { z } from 'zod';

import { shared } from '../shared/notion.shared';

export const appendPage = createAction({
  id: 'notion_action_append-to-page',
  name: 'Append to Page',
  description: 'Appends content to an existing page.',
  inputConfig: [
    shared.fields.dynamicSelectPage,
    createTextInputField({
      id: 'content',
      label: 'Content',
      description: 'The content you will append',
      placeholder: 'Enter content',
      required: {
        missingMessage: 'Content is required',
        missingStatus: 'warning',
      },
    }),
  ],
  aiSchema: z.object({
    page: z.string().describe('The ID of the page to append to'),
    content: z.string().describe('The content to append to the page'),
  }),
  run: async ({ configValue, connection }) => {
    const notionLib = shared.notionLib({
      accessToken: connection.accessToken,
    });

    const response = await notionLib.blocks.children.append({
      block_id: configValue.page,
      children: [
        {
          object: 'block',
          type: 'paragraph',
          paragraph: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: configValue.content,
                },
              },
            ],
          },
        },
      ],
    });

    return response.results[0];
  },
  mockRun: async () => {
    return {
      object: 'block',
      id: 'block-id',
      parent: {
        type: 'page_id',
        page_id: 'page-id',
      },
      created_time: '2024-06-15T21:33:00.000Z',
      last_edited_time: '2024-06-15T21:33:00.000Z',
      created_by: {
        object: 'user',
        id: 'user-id',
      },
      last_edited_by: {
        object: 'user',
        id: 'user-id',
      },
      has_children: false,
      archived: false,
      in_trash: false,
      type: 'paragraph',
      paragraph: {
        rich_text: [
          {
            type: 'text',
            text: {
              content: 'Appended Content',
              link: null,
            },
            annotations: {
              bold: false,
              italic: false,
              strikethrough: false,
              underline: false,
              code: false,
              color: 'default',
            },
            plain_text: 'Appended Content',
            href: null,
          },
        ],
        color: 'default',
      },
    };
  },
});
