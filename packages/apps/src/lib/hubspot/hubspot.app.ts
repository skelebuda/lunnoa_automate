import { createApp } from '@lunnoa-automate/toolkit';

import { retrieveContact } from './actions/retrieve-contact.action';
import { addContactToList } from './actions/add-contact-to-list.action';
import { createContact } from './actions/create-contact.action';
import { removeContactFromList } from './actions/remove-contact-from-list.action';
import { updateContact } from './actions/update-contact.action';
import { upsertContact } from './actions/upsert-contact.action';
import { hubspotOAuth2 } from './connections/hubspot.oauth2';
import { retrieveContactByEmail } from './actions/retrieve-contact-by-email.action';
import { retrieveContactNotes } from './actions/retrieve-contact-notes.action';

export const hubspot = createApp({
  id: 'hubspot',
  name: 'HubSpot',
  description:
    'HubSpot is a cloud-based platform that connects marketing, sales, and customer service tools into a single CRM database.',
  logoUrl:
    'https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/hubspot.svg',
  actions: [
    retrieveContact,
    upsertContact,
    createContact,
    updateContact,
    addContactToList,
    removeContactFromList,
    retrieveContactByEmail,
    retrieveContactNotes,
  ],
  triggers: [],
  connections: [hubspotOAuth2],
});
