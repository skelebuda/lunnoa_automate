import { createAction } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

import { shared } from '../shared/google-contacts.shared';

export const createContact = createAction({
  id: 'google-contacts_action_create-contact',
  name: 'Create Contact',
  description: 'Creates a new contact with provided details.',
  aiSchema: z.object({
    name: z.string().describe('The name of the new contact.'),
    email: z
      .string()
      .email()
      .nullable()
      .optional()
      .describe('The email address of the new contact.'),
    phone: z
      .string()
      .nullable()
      .optional()
      .describe('The phone number of the new contact.'),
  }),
  inputConfig: [
    {
      id: 'name',
      label: 'Contact Name',
      description: 'The name of the new contact.',
      inputType: 'text',
      placeholder: 'Enter contact name',
      required: {
        missingMessage: 'Contact name is required',
        missingStatus: 'warning',
      },
    },
    {
      id: 'email',
      label: 'Email Address',
      description: '',
      inputType: 'text',
      placeholder: 'Enter email address',
    },
    {
      id: 'phone',
      label: 'Phone Number',
      description: '',
      inputType: 'text',
      placeholder: 'Enter phone number',
    },
  ],
  run: async ({ configValue, connection }) => {
    const googleContacts = shared.googleContacts({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
    });

    const { name, email, phone } = configValue;

    const newContact = await googleContacts.people.createContact({
      requestBody: {
        names: [{ displayName: name }],
        emailAddresses: email ? [{ value: email }] : undefined,
        phoneNumbers: phone ? [{ value: phone }] : undefined,
      },
    });

    return newContact.data;
  },
  mockRun: async () => {
    return {
      resourceName: 'people/c123456789',
      names: [{ displayName: 'John Doe' }],
      emailAddresses: [{ value: 'john.doe@example.com' }],
      phoneNumbers: [{ value: '+1234567890' }],
    };
  },
});
