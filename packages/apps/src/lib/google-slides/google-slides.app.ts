import { createApp } from '@lunnoa-automate/toolkit';

import { googleSlidesOAuth2 } from './connections/google-slides.oauth2';
import { createPresentation } from './actions/create-presentation.action';

export const googleSlides = createApp({
  id: 'google-slides',
  name: 'Google Slides',
  description:
    'Google Slides a slideshow presentation program developed by Google.',
  logoUrl:
    'https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/google-slides.svg',
  actions: [createPresentation],
  triggers: [],
  connections: [googleSlidesOAuth2],
});
