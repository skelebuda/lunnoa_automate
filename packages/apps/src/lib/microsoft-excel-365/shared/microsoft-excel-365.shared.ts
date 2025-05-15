import { createDynamicSelectInputField, createNumberInputField, FieldConfig } from '@lunnoa-automate/toolkit';


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
    
    headerRowNumber: createNumberInputField({
      id: 'headerRowNumber',
      label: 'Header Row Number',
      description: 'The row number that contains the headers',
      defaultValue: 1,
      required: {
        missingStatus: 'warning',
        missingMessage: 'Header row number is required',
      },
    }),
    
    dynamicSelectHeadersMap: {
      id: 'mappings',
      label: 'Column Mappings',
      description: 'Map values to columns',
      inputType: 'map',
      mapOptions: {
        keyLabel: 'Column',
        valueLabel: 'Value',
        keyPlaceholder: 'Select column',
        valuePlaceholder: 'Enter value',
      },
      _getDynamicKeys: async ({ connection, workspaceId, http, extraOptions }) => {
        if (!extraOptions?.workbookId || !extraOptions?.worksheetId || !extraOptions?.headerRowNumber) {
          return [];
        }
        
        const headerRow = extraOptions.headerRowNumber;
        const url = `https://graph.microsoft.com/v1.0/me/drive/items/${extraOptions.workbookId}/workbook/worksheets/${extraOptions.worksheetId}/range(address='${headerRow}:${headerRow}')`;
        
        const response = await http.request({
          method: 'GET',
          url,
          headers: {
            Authorization: `Bearer ${connection.accessToken}`,
          },
          workspaceId,
        });
        
        if (!response.data.values || !response.data.values[0]) {
          return [];
        }
        
        return response.data.values[0].map((header: string, index: number) => ({
          value: header,
          label: header,
        }));
      },
      loadOptions: {
        dependsOn: [
          {
            id: 'workbookId',
            value: ''
          },
          {
            id: 'worksheetId',
            value: ''
          },
          {
            id: 'headerRowNumber',
            value: ''
          },
        ],
      },
      required: {
        missingStatus: 'warning',
        missingMessage: 'At least one column mapping is required',
      },
    } as FieldConfig,
  },
};
