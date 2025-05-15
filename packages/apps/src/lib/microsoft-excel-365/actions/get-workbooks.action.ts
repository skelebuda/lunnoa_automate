import { createAction } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const getWorkbooks = createAction({
  id: 'microsoft-excel-365_action_get-workbooks',
  name: 'Get Workbooks',
  description: 'Get a list of Excel workbooks from your OneDrive',
  aiSchema: z.object({}), // No input parameters needed for this action
  inputConfig: [], // No configuration needed from the user
  run: async ({ connection, workspaceId, http }) => {
    const url = "https://graph.microsoft.com/v1.0/me/drive/root/search(q='.xlsx')?select=id,name";

    const response = await http.request({
      method: 'GET',
      url,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
      workspaceId,
    });

    return response.data.value.map((item: any) => ({
      id: item.id,
      name: item.name,
    }));
  },
  mockRun: async () => {
    return [
      {
        id: '01ABCDEF12345678',
        name: 'Budget.xlsx',
      },
      {
        id: '01GHIJKL87654321',
        name: 'Sales Report.xlsx',
      },
    ];
  },
}); 