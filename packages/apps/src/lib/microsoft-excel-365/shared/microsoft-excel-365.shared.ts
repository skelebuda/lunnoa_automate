import { createDynamicSelectInputField } from '@lunnoa-automate/toolkit';


export const shared = {
  fields: {
    dynamicSelectWorkbooks: createDynamicSelectInputField({
      id: 'workbookId',
      label: 'Workbook',
      description: 'Select a workbook',
      _getDynamicValues: async ({ connection, workspaceId, http }) => {
        const url = "https://graph.microsoft.com/v1.0/me/drive/root/children?$select=id,name,file";
      
        const response = await http.request({
          method: 'GET',
          url,
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
          workspaceId,
        });
      
        // Filter for Excel files based on MIME type
        return response?.data?.value
          .filter((item: any) =>
            item.file?.mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          )
          .map((item: any) => ({
            value: item.id,
            label: item.name,
          }));
      },
      required: {
        missingStatus: 'warning',
        missingMessage: 'Workbook is required',
      },
    }),
    dynamicSelectWorksheets: createDynamicSelectInputField({
      id: 'worksheetId',
      label: 'Worksheet',
      description: 'Select a worksheet',
      _getDynamicValues: async ({ connection, workspaceId, http, extraOptions }) => {
        if (!extraOptions?.workbookId) {
          return [];
        }
        const url = `https://graph.microsoft.com/v1.0/me/drive/items/${extraOptions.workbookId}/workbook/worksheets`;
        const response = await http.request({
          method: 'GET',
          url,
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
          workspaceId,
        });
        return response.data.value.map((item: any) => ({
          value: item.id,
          label: item.name,
        }));
      },
      loadOptions: {
        dependsOn: [
          {
            id: 'workbookId',
            value: '',
          },
        ],
      },
      required: {
        missingStatus: 'warning',
        missingMessage: 'Worksheet is required',
      },
    }),
  },
};