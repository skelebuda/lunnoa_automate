import { createAction, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const createWorkbook = createAction({
  id: 'microsoft-excel-365_action_create-workbook',
  name: 'Create Workbook',
  description: 'Creates a new Excel workbook in your OneDrive.',
  inputConfig: [
    createTextInputField({
      id: 'name',
      label: 'Name',
      description: 'The name of the new Excel workbook.',
      placeholder: 'Enter workbook name',
      required: {
        missingMessage: 'Workbook name is required',
        missingStatus: 'warning',
      },
    }),
  ],
  aiSchema: z.object({
    name: z.string().describe('The name of the new Excel workbook.'),
  }),
  run: async ({ configValue, connection, workspaceId, http }) => {
    // Make sure the name ends with .xlsx
    let fileName = configValue.name;
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      fileName += '.xlsx';
    }

    // Create an empty workbook in the root of OneDrive
    const url = 'https://graph.microsoft.com/v1.0/me/drive/root/children';
    
    const response = await http.request({
      method: 'POST',
      url,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        name: fileName,
        file: {},
        '@microsoft.graph.conflictBehavior': 'rename'
      },
      workspaceId,
    });

    // Return the created workbook details
    return {
      id: response.data.id,
      name: response.data.name,
      webUrl: response.data.webUrl,
    };
  },
  mockRun: async ({ configValue }) => {
    // Make sure the name ends with .xlsx for the mock
    let fileName = configValue.name || 'New Workbook';
    if (!fileName.toLowerCase().endsWith('.xlsx')) {
      fileName += '.xlsx';
    }

    return {
      id: '01ABCDEF12345678',
      name: fileName,
      webUrl: `https://onedrive.live.com/edit.aspx?cid=123456&id=documents&resid=123456&app=Excel&authkey=abc123`,
    };
  },
}); 