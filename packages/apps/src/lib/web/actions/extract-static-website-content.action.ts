import {
  createAction,
  createMarkdownField,
  createTextInputField,
} from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const extractStaticWebsiteContent = createAction({
  id: 'web_action_extract-static-website-content',
  name: 'Extract Static Website Content',
  description: 'Visits a static website and extracts data.',
  iconUrl: `https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/web.svg`,
  inputConfig: [
    createTextInputField({
      id: 'url',
      label: 'URL',
      description: 'The URL of the website to visit',
      placeholder: 'Add URL',
      required: {
        missingMessage: 'Please enter a URL',
        missingStatus: 'warning',
      },
    }),
    createMarkdownField({
      id: 'markdown',
      markdown:
        'Uses external API. The amount depends on the size of the website.',
    }),
  ],

  aiSchema: z.object({
    url: z.string().describe('The URL of the website to visit'),
  }),

  run: async ({
    configValue,
    workspaceId,
    projectId,
    agentId,
    executionId,
    workflowId,
    http,
  }) => {
    const { url } = configValue;

    const taskId = process.env.APIFY_EXTRACT_STATIC_CONTENT_TASK_ID.replace('/', '~');
    const taskUrl = `https://api.apify.com/v2/actor-tasks/${taskId}/runs?token=${process.env.APIFY_API_KEY}&timeout=60&waitForFinish=60`;

    let urlToSearch = url;
    if (
      !urlToSearch.startsWith('http://') &&
      !urlToSearch.startsWith('https://')
    ) {
      urlToSearch = `https://${urlToSearch}`;
    }

    const runSyncResponse = (await http.request({
      method: 'POST',
      url: taskUrl,
      data: {
        startUrls: [{ url: urlToSearch }],
      },
      workspaceId,
    })) as { data: { data: RunSyncResponse } };

    const datasetId = runSyncResponse.data?.data?.defaultDatasetId;

    if (!datasetId) {
      throw new Error('Web search ran, but no data was returned.');
    }

    const datasetUrl = `https://api.apify.com/v2/datasets/${datasetId}/items?token=${process.env.APIFY_API_KEY}`;

    const datasetItemResponse = (await http.request({
      method: 'GET',
      url: datasetUrl,
      workspaceId,
    })) as { data: DatasetItemResponse };

    const items = datasetItemResponse.data;
    const firstItem = items[0];
    const data = firstItem.data ?? '';


    return {
      url: firstItem.url,
      data,
    };
  },

  mockRun: async () => {
    return {
      url: 'https://example.com',
      data: 'The content of the website in text format will be here',
    };
  },
});

type RunSyncResponse = {
  id: string;
  actId: string;
  actorTaskId: string;
  buildId: string;
  finishedAt: null | string;
  usageTotalUsd: number;
  status: 'RUNNING' | 'SUCCEEDED' | 'FAILED';
  defaultDatasetId: string;
};

type DatasetItemResponse = [
  {
    crawl: {
      depth: number;
      httpStatusCode: number;
      loadedTime: string;
      loadedUrl: string;
      referralUrl: string;
    };
    debug: {
      requestHandlerMode: 'browser';
    };
    metadata: {
      author: string;
      canonicalUrl: string;
      description: string;
    };
    screenshotUrl: null | string;
    data: string;
    url: string;
  },
];
