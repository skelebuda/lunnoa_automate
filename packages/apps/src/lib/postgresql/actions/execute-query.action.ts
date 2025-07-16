import { createAction, createCodeInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';
import { Client } from 'pg';

export const executeQuery = createAction({
  id: 'postgresql_action_execute-query',
  name: 'Execute SQL Query',
  description: 'Executes a SQL query on your PostgreSQL database.',
  inputConfig: [
    createCodeInputField({
      id: 'sqlQuery',
      label: 'SQL Query',
      description: 'The SQL query to execute.',
      required: {
        missingMessage: 'SQL Query is required.',
        missingStatus: 'error',
      },
    }),
  ],
  aiSchema: z.object({
    sqlQuery: z.string().describe('The SQL query to execute on the PostgreSQL database.'),
  }),
  run: async ({ configValue, connection }) => {
    const { sqlQuery } = configValue;
    const { username, password, host, port, database, ssl } = connection as any;

    console.log('Connection:', connection);

    const client = new Client({
      user: username,
      host,
      database,
      password,
      port,
      ssl,
    });
    await client.connect();
    try {
      const result = await client.query({ text: sqlQuery });
      return result.rows;
    } finally {
      await client.end();
    }
  },
  mockRun: async () => {
    return [
        { column1: 'mock_data1', column2: 123 },
        { column1: 'mock_data2', column2: 456 }
    ];
  },
}); 