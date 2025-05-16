import { createAction, createDynamicSelectInputField, createTextInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';
import { shared } from '../shared/microsoft-excel-365.shared';

export const addRowToWorksheet = createAction({
  id: 'microsoft-excel-365_action_add-row-to-sheet',
  name: 'Add Row to Sheet',
  description: 'Adds a new row to the specified worksheet in an Excel workbook.',
  inputConfig: [
    shared.fields.dynamicSelectWorkbooks,
    shared.fields.dynamicSelectWorksheets,
    createTextInputField({
      id: 'values',
      label: 'Row Values (comma separated)',
      description: 'Values for the new row, separated by commas.',
      placeholder: 'e.g. John, 30, john@example.com',
      required: {
        missingMessage: 'Row values are required',
        missingStatus: 'warning',
      },
    }),
  ],
  aiSchema: z.object({
    workbookId: z.string().describe('The ID of the Excel workbook.'),
    worksheetId: z.string().describe('The ID of the worksheet.'),
    values: z.string().describe('Comma-separated values for the new row.'),
  }),
  run: async ({ configValue, connection, workspaceId, http }) => {
    const { workbookId, worksheetId, values } = configValue;
    const rowValues = values.split(',').map((v: string) => v.trim());

    // 1. Get the used range to find the next empty row
    const usedRangeUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/usedRange`;
    const usedRangeResp = await http.request({
      method: 'GET',
      url: usedRangeUrl,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
      },
      workspaceId,
    });

    const address = usedRangeResp.data.address; // e.g. 'Sheet1!A1:D10'
    const match = address.match(/([A-Z]+)(\d+):([A-Z]+)(\d+)/);
    let nextRow = 2;
    if (match) {
      nextRow = parseInt(match[4], 10) + 1;
    }

    // 2. Write the new row at the next empty row
    const colCount = rowValues.length;
    const startCol = 'A';
    const endCol = String.fromCharCode('A'.charCodeAt(0) + colCount - 1);
    const range = `${startCol}${nextRow}:${endCol}${nextRow}`;

    const patchUrl = `https://graph.microsoft.com/v1.0/me/drive/items/${workbookId}/workbook/worksheets/${worksheetId}/range(address='${range}')`;
    const patchResp = await http.request({
      method: 'PATCH',
      url: patchUrl,
      headers: {
        Authorization: `Bearer ${connection.accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        values: [rowValues],
      },
      workspaceId,
    });

    return {
      address: patchResp.data.address,
      values: patchResp.data.values,
      rowIndex: nextRow,
    };
  },
  mockRun: async ({ configValue }) => {
    const rowValues = configValue.values.split(',').map((v: string) => v.trim());
    return {
      address: 'Sheet1!A11:C11',
      values: [rowValues],
      rowIndex: 11,
    };
  },
}); 