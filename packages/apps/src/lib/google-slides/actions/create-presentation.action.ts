import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

import { shared } from '../shared/google-slides.shared';

export const createPresentation = createAction({
  id: 'google-slides_action_create-presentation',
  name: 'Create Presentation',
  description: 'Creates a new, blank presentation.',
  inputConfig: [
    createTextInputField({
      id: 'title',
      label: 'Title',
      description: 'The title of the new presentation.',
      placeholder: 'My Awesome Presentation',
      required: {
        missingMessage: 'Title is required',
        missingStatus: 'warning',
      },
    }),
  ],
  aiSchema: z.object({
    title: z.string().describe('The title for the new presentation.'),
  }),
  run: async ({ configValue, connection }) => {
    const slides = shared.googleSlides({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
    });

    const presentation = await slides.presentations.create({
      requestBody: {
        title: configValue.title,
      },
    });

    return {
      presentationId: presentation.data.presentationId,
      title: presentation.data.title,
      slides: presentation.data.slides?.map(slide => slide.objectId),
    };
  },
  mockRun: async ({ configValue }) => {
    return {
      presentationId: 'mock-presentation-id',
      title: configValue.title,
      slides: ['mock-slide-id-1'],
    };
  },
}); 