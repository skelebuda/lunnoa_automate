import { createDynamicSelectInputField } from '@lunnoa-automate/toolkit';
import { google } from 'googleapis';

export const shared = {
  fields: {
    dynamicSelectForm: createDynamicSelectInputField({
      label: 'Form',
      id: 'form',
      placeholder: 'Select form',
      description: 'The form to access',
      _getDynamicValues: async ({ connection }) => {
        const googleDrive = await shared.googleDrive({
          accessToken: connection.accessToken,
          refreshToken: connection.refreshToken,
        });

        const forms = await (googleDrive.files as any).list({
          q: "mimeType='application/vnd.google-apps.form' and trashed=false",
        });

        return (
          forms?.data?.files?.map((file) => {
            return {
              value: file.id,
              label: file.name,
            };
          }) ?? []
        );
      },
      required: {
        missingMessage: 'Form is required',
        missingStatus: 'warning',
      },
    }),
  },
  googleForm({
    accessToken,
    refreshToken,
  }: {
    accessToken: string;
    refreshToken: string;
  }) {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.INTEGRATION_GOOGLE_CLIENT_ID,
      process.env.INTEGRATION_GOOGLE_CLIENT_SECRET,
      `${process.env.SERVER_URL}/workflow-apps/oauth2callback`,
    );

    oAuth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return google.forms({
      version: 'v1',
      auth: oAuth2Client,
    });
  },
  googleDrive({
    accessToken,
    refreshToken,
  }: {
    accessToken: string;
    refreshToken: string;
  }) {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.INTEGRATION_GOOGLE_CLIENT_ID,
      process.env.INTEGRATION_GOOGLE_CLIENT_SECRET,
      `${process.env.SERVER_URL}/workflow-apps/oauth2callback`,
    );

    oAuth2Client.setCredentials({
      access_token: accessToken,
      refresh_token: refreshToken,
    });

    return google.drive({
      version: 'v2',
      auth: oAuth2Client,
    });
  },
};
