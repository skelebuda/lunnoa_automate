import { createAction, createDynamicSelectInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';

import { shared } from '../shared/microsoft-excel-365.shared';

export const addRowToWorksheet = createAction({
  id: 'microsoft-excel-365_action_add-row-to-worksheet',
  name: 'Add Row to Worksheet',
  description: 'Adds a new row to the specified worksheet.',
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
    shared.fields.headerRowNumber,
    shared.fields.dynamicSelectHeadersMap,
  ],
  aiSchema: z.object({
    workbookId: z.string().describe('The ID of the workbook'),
    worksheetId: z.string().describe('The ID of the worksheet'),
    headerRowNumber: z
      .number()
      .describe('The row number the header columns are located on.'),
    mappings: z
      .array(
        z.object({
          key: z.string().nullable().optional().describe('Not used'),
          value: z.string().describe('the value to enter in the cell'),
        }),
      )
      .describe('An array of values to add to the new row.'),
  }),
  run: async ({ configValue, connection, workspaceId, http }) => {
    const { workbookId, worksheetId, mappings } = configValue;

    // First, get the used range to determine the number of rows
    const usedRangeUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange`;
    
    const usedRangeResponse = await http.request({
      method: 'GET',
      url: usedRangeUrl,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
      workspaceId,
    });
    
    const numRows = usedRangeResponse.data.rowCount || 0;
    const insertPosition = numRows + 1;
    
    // Create the values array from the mappings
    const values = [mappings.map(mapping => mapping.value)];
    
    // Add the row to the worksheet
    const addRowUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='A${insertPosition}')`;
    
    const response = await http.request({
      method: 'PATCH',
      url: addRowUrl,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        values
      },
      workspaceId,
    });
    
    return {
      workbookId,
      worksheetId,
      updatedRange: response.data.address,
      updatedRows: 1,
      updatedColumns: values[0].length,
      updatedCells: values[0].length,
    };
  },
  mockRun: async () => ({
    workbookId: 'some-workbook-id',
    worksheetId: 'some-worksheet-id',
    updatedRange: 'Sheet1!A2:C2',
    updatedRows: 1,
    updatedColumns: 3,
    updatedCells: 3,
  }),
}); 