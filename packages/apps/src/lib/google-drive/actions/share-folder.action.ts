import {
  createAction,
  createSelectInputField,
  createTextInputField,
} from '@lunnoa-automate/toolkit';
import { z } from 'zod';

import { shared } from '../shared/google-drive.shared';

export const shareFolder = createAction({
  id: 'google-drive_action_share-folder',
  name: 'Share Folder',
  description: `Share a folder that this platform has created.`,
  aiSchema: z.object({
    folder: z.string().describe('The ID of the folder to share'),
    role: z
      .enum(['writer', 'commenter', 'reader'])
      .describe('The role of the user'),
    email: z.string().describe('The email of the user'),
  }),
  inputConfig: [
    shared.fields.dynamicSelectFolder,
    createSelectInputField({
      id: 'role',
      label: 'Role',
      description: 'The role of the user',
      placeholder: 'Select a role',
      selectOptions: [
        { label: 'Writer', value: 'writer' },
        { label: 'Commenter', value: 'commenter' },
        { label: 'Reader', value: 'reader' },
      ],
      required: {
        missingMessage: 'Content is required',
        missingStatus: 'warning',
      },
    }),
    createTextInputField({
      id: 'email',
      label: 'Email',
      description: 'The email address of the user',
      placeholder: 'Enter email',
      required: {
        missingMessage: 'Email is required',
        missingStatus: 'warning',
      },
    }),
  ],
  run: async ({ configValue, connection }) => {
    const googleDrive = await shared.googleDrive({
      accessToken: connection.accessToken,
      refreshToken: connection.refreshToken,
    });

    const { folder, role, email } = configValue;

    await googleDrive.permissions.create({
      fileId: folder,
      requestBody: {
        role: role,
        type: 'user',
        emailAddress: email,
      },
    });

    return {
      folderId: folder,
      role: role,
      emailAddress: email,
    };
  },

  mockRun: async () => {
    return {
      folderId: 'mock-folder-id',
      role: 'commenter',
      emailAddress: 'example@test.com',
    };
  },
});
