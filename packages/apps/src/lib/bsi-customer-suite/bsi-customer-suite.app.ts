import { createApp } from '@lunnoa-automate/toolkit';

import { retrieveContact } from './actions/retrieve-contact.action';
import { addContactToList } from './actions/add-contact-to-list.action';
import { createContact } from './actions/create-contact.action';
import { removeContactFromList } from './actions/remove-contact-from-list.action';
import { updateContact } from './actions/update-contact.action';
import { upsertContact } from './actions/upsert-contact.action';
import { bsiCustomerSuiteOAuth2 } from './connections/bsi-customer-suite.oauth2';
import { retrieveContactByEmail } from './actions/retrieve-contact-by-email.action';
import { retrieveContactNotes } from './actions/retrieve-contact-notes.action';
import { createContactNote } from './actions/create-contact-note.action';

export const bsiCustomerSuite = createApp({
  id: 'bsi-customer-suite',
  name: 'BSI Customer Suite',
  description:
    'BSI Customer Suite is a cloud-based platform that connects marketing, sales, and customer service tools into a single CRM database.',
  logoUrl:
    'https://cdn.brandfetch.io/idLPTH2Bhb/w/2048/h/2048/theme/dark/icon.png?c=1bxid64Mup7aczewSAYMX&t=1744229196436',
  actions: [
    retrieveContact,
    upsertContact,
    createContact,
    updateContact,
    addContactToList,
    removeContactFromList,
    retrieveContactNotes,
    createContactNote,
  ],
  triggers: [],
  connections: [bsiCustomerSuiteOAuth2],
});
