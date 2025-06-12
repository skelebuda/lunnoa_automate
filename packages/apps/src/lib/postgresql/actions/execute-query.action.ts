import { createAction, createCodeInputField } from '@lunnoa-automate/toolkit';
import { z } from 'zod';
import { Pool } from 'pg';

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
    const { username, password, host, port, database } = connection as any;

    const pool = new Pool({
      user: username,
      host,
      database,
      password,
      port,
    });

    try {
      const result = await pool.query(sqlQuery);
      await pool.end();
      return result.rows;
    } catch (error) {
      await pool.end();
      // It's good practice to throw the error to be handled by the global error handler
      // and to let the user know what went wrong.
      throw new Error(`Error executing query: ${error.message}`);
    }
  },
  mockRun: async () => {
    return [
        { column1: 'mock_data1', column2: 123 },
        { column1: 'mock_data2', column2: 456 }
    ];
  },
}); 