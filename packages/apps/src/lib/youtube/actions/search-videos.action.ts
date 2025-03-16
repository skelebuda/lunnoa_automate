import {
  createAction,
  createNumberInputField,
  createSelectInputField,
  createTextInputField,
  parseNumberOrThrow,
} from '@lunnoa-automate/toolkit';
import { z } from 'zod';

import { shared } from '../shared/youtube.shared';

export const searchVideos = createAction({
  id: 'youtube_action_search-videos',
  name: 'Search Videos',
  description: 'Search for videos on YouTube using a query string',
  aiSchema: z.object({
    query: z
      .string()
      .nonempty()
      .describe('The search query string to find YouTube videos.'),
    maxResults: z
      .number()
      .min(1)
      .max(50)
      .default(5)
      .nullable()
      .optional()
      .describe('The maximum number of search results to return'),
    videoDuration: z
      .enum(['any', 'short', 'medium', 'long'])
      .describe('Filter video results by duration.'),
    videoType: z
      .enum(['any', 'episode', 'movie'])
      .describe('Filter video results by type.'),
  }),
  inputConfig: [
    createTextInputField({
      label: 'Search Query',
      id: 'query',
      placeholder: 'Enter search query',
      description:
        'Search for videos using keywords such as "JavaScript tutorials" or "funny cat videos".',
      required: {
        missingMessage: 'Search query is required',
        missingStatus: 'warning',
      },
    }),
    createSelectInputField({
      label: 'Video Duration',
      id: 'videoDuration',
      defaultValue: 'any',
      selectOptions: [
        { value: 'any', label: 'Any' },
        { value: 'short', label: 'Short (< 4 min)' },
        { value: 'medium', label: 'Medium (4-20 min)' },
        { value: 'long', label: 'Long (> 20 min)' },
      ],
      description: 'Filter videos by duration.',
    }),
    createSelectInputField({
      label: 'Video Type',
      id: 'videoType',
      defaultValue: 'any',
      selectOptions: [
        { value: 'any', label: 'Any' },
        { value: 'episode', label: 'Episode' },
        { value: 'movie', label: 'Movie' },
      ],
      description: 'Filter videos by type.',
    }),
    createNumberInputField({
      label: 'Max Results',
      id: 'maxResults',
      defaultValue: 5,
      placeholder: 'Add max results',
      description: 'The maximum number of videos to return.',
    }),
  ],

  run: async ({ configValue, connection }) => {
    const youtube = shared.youtube({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
    });

    const response = await youtube.search.list({
      part: ['snippet'],
      q: configValue.query,
      maxResults: parseNumberOrThrow({
        value: configValue.maxResults ?? 5,
        propertyName: 'Max results',
      }),
      videoDuration: configValue.videoDuration,
      type: ['video'],
      videoType: configValue.videoType,
    });

    return { data: (response.data.items ?? []) as typeof mock };
  },

  mockRun: async () => {
    return { data: mock };
  },
});

const mock = [
  {
    kind: 'youtube#searchResult',
    etag: 'q3aBcNKMmb9WNrsXadLhdwL7F-A',
    id: {
      kind: 'youtube#video',
      videoId: 'W6NZfCO5SIk',
    },
    snippet: {
      publishedAt: '2018-04-24T02:37:33Z',
      channelId: 'UCWv7vMbMWH4-V0ZXdmDpPBA',
      title: 'JavaScript Tutorial for Beginners: Learn JavaScript in 1 Hour',
      description:
        'Learn JavaScript basics in 1 hour! ⚡ This beginner-friendly tutorial covers everything you need to start coding. Ready to dive ...',
      thumbnails: {
        default: {
          url: 'https://i.ytimg.com/vi/W6NZfCO5SIk/default.jpg',
          width: 120,
          height: 90,
        },
        medium: {
          url: 'https://i.ytimg.com/vi/W6NZfCO5SIk/mqdefault.jpg',
          width: 320,
          height: 180,
        },
        high: {
          url: 'https://i.ytimg.com/vi/W6NZfCO5SIk/hqdefault.jpg',
          width: 480,
          height: 360,
        },
      },
      channelTitle: 'Programming with Mosh',
      liveBroadcastContent: 'none',
      publishTime: '2018-04-24T02:37:33Z',
    },
  },
  {
    kind: 'youtube#searchResult',
    etag: 'PwmHwF6VnrSfV63D19WDETZBdp0',
    id: {
      kind: 'youtube#video',
      videoId: 'lkIFF4maKMU',
    },
    snippet: {
      publishedAt: '2022-11-22T15:04:57Z',
      channelId: 'UCsBjURrPoezykLs9EqgamOA',
      title: '100+ JavaScript Concepts you Need to Know',
      description:
        'The ultimate 10 minute JavaScript course that quickly breaks down over 100 key concepts every web developer should know.',
      thumbnails: {
        default: {
          url: 'https://i.ytimg.com/vi/lkIFF4maKMU/default.jpg',
          width: 120,
          height: 90,
        },
        medium: {
          url: 'https://i.ytimg.com/vi/lkIFF4maKMU/mqdefault.jpg',
          width: 320,
          height: 180,
        },
        high: {
          url: 'https://i.ytimg.com/vi/lkIFF4maKMU/hqdefault.jpg',
          width: 480,
          height: 360,
        },
      },
      channelTitle: 'Fireship',
      liveBroadcastContent: 'none',
      publishTime: '2022-11-22T15:04:57Z',
    },
  },
];
