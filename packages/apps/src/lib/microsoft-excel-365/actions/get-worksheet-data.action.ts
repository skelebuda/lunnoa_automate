import { createAction, createDynamicSelectInputField, createSwitchInputField, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

import { shared } from '../shared/microsoft-excel-365.shared';

export const getWorksheetData = createAction({
  id: 'microsoft-excel-365_action_get-worksheet-data',
  name: 'Get Worksheet Data',
  description: 'Reads data from a specified Excel workbook and worksheet.',
  aiSchema: z.object({
    workbookId: z.string().describe('The ID of the Excel workbook.'),
    worksheetId: z.string().describe('The ID of the worksheet.'),
    range: z
      .string()
      .describe(
        'The range of cells to read (e.g., "A1:D10"). Leave empty to read the entire worksheet.',
      )
      .nullable()
      .optional(),
    loadAllData: z
      .enum(['true', 'false'])
      .default('true')
      .describe('If true, all worksheet data will be returned')
      .nullable()
      .optional(),
  }),
  inputConfig: [
    shared.fields.dynamicSelectWorkbooks,
    createDynamicSelectInputField({
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
            value: ''
          },
        ],
      },
      required: {
        missingStatus: 'warning',
        missingMessage: 'Worksheet is required',
      },
    }),
    createSwitchInputField({
      id: 'loadAllData',
      label: 'Load All Data',
      description: '',
      switchOptions: {
        checked: 'true',
        unchecked: 'false',
        defaultChecked: true,
      },
    }),
    createTextInputField({
      id: 'range',
      label: 'Custom Range',
      description: 'The range of cells to read (e.g., "A1:D10").',
      placeholder: 'Enter range',
      loadOptions: {
        dependsOn: [
          {
            id: 'loadAllData',
            value: 'false',
          },
        ],
      },
    }),
  ],
  run: async ({ configValue, connection, workspaceId, http }) => {
    const { workbookId, worksheetId, range, loadAllData } = configValue;
    
    let url;
    
    if (loadAllData === 'true') {
      // Get all data from the worksheet
      url = `https://graph.microsoft.com/v1.0/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange`;
    } else {
      if (!range) {
        throw new Error('Range is required when "Load All Data" is disabled.');
      }
      // Get data from the specified range
      url = `https://graph.microsoft.com/v1.0/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${range}')`;
    }
    
    const response = await http.request({
      method: 'GET',
      url,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
      workspaceId,
    });
    
    return {
      values: response.data.values,
      address: response.data.address,
      rowCount: response.data.rowCount,
      columnCount: response.data.columnCount,
    };
  },
  mockRun: async () => {
    return {
      values: [
        ['Name', 'Age', 'Email', 'Phone'],
        ['John Doe', '30', 'john.doe@example.com', '+1234567890'],
        ['Jane Smith', '25', 'jane.smith@example.com', '+0987654321'],
      ],
      address: 'Sheet1!A1:D3',
      rowCount: 3,
      columnCount: 4,
    };
  },
}); 