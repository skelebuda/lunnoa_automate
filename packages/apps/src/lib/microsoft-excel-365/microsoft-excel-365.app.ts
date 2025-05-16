import { createApp } from '@lunnoa-automate/toolkit';

import { getWorksheets } from './actions/get-worksheets.action';
import { createWorkbook } from './actions/create-workbook.action';
import { getWorksheetData } from './actions/get-worksheet-data.action';
import { microsoftExcel365OAuth2 } from './connections/microsoft-excel-365.oauth2';

export const microsoftExcel365 = createApp({
  id: 'microsoft-excel-365',
  name: 'Microsoft Excel 365',
  description:
    'Microsoft Excel is the industry leading spreadsheet software program, a powerful data visualization and analysis tool.',
  logoUrl:
    'https://lecca-io.s3.us-east-2.amazonaws.com/assets/apps/microsoft-excel-365.svg',
  actions: [getWorksheets, createWorkbook, getWorksheetData],
  triggers: [],
  connections: [microsoftExcel365OAuth2],
});
