import { createApp } from '@lunnoa-automate/toolkit';

import { addUser } from './actions/add-user.action';
import { deleteUser } from './actions/delete-user.action';
import { listUsers } from './actions/list-users.action';
import { searchLeads } from './actions/search-lead.action';
import { upsertContact } from './actions/upsert-contact.action';
import { upsertLead } from './actions/upsert-lead.action';
import { zohoCrmOAuth2US } from './connections/zoho-crm.oauth2';
import { newContact } from './triggers/new-contact.trigger';
import { newLead } from './triggers/new-lead.trigger';

export const zohoCrm = createApp({
  id: 'zoho-crm',
  name: 'Zoho CRM',
  description:
    'Zoho CRM acts as a single repository to bring your sales, marketing, and customer support activities together.',
  logoUrl:
    'https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/zoho-crm.svg',
  actions: [
    upsertContact,
    upsertLead,
    searchLeads,
    addUser,
    listUsers,
    deleteUser,
  ],
  triggers: [newContact, newLead],
  connections: [zohoCrmOAuth2US],
});
