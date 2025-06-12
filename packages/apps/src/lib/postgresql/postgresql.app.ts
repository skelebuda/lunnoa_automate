import { createApp, createBasicAuthConnection, createTextInputField, createNumberInputField } from '@lunnoa-automate/toolkit';
import { executeQuery } from './actions/execute-query.action';

export const postgresql = createApp({
  id: 'postgresql',
  name: 'PostgreSQL',
  description: 'Connect to and interact with a PostgreSQL database.',
  logoUrl: 'https://cdn.worldvectorlogo.com/logos/postgresql.svg',
  connections: [
    createBasicAuthConnection({
        id: 'postgresql_connection',
        name: 'PostgreSQL Connection',
        description: 'Credentials for your PostgreSQL database.',
        inputConfig: [
            createTextInputField({
                id: 'host',
                label: 'Host',
                description: 'The hostname or IP address of your PostgreSQL server.',
                required: {
                    missingMessage: 'Host is required.',
                    missingStatus: 'error',
                },
            }),
            createNumberInputField({
                id: 'port',
                label: 'Port',
                description: 'The port number of your PostgreSQL server.',
                defaultValue: 5432,
                required: {
                    missingMessage: 'Port is required.',
                    missingStatus: 'error',
                },
            }),
            createTextInputField({
                id: 'database',
                label: 'Database',
                description: 'The name of the database to connect to.',
                required: {
                    missingMessage: 'Database is required.',
                    missingStatus: 'error',
                },
            }),
        ]
    })
  ],
  actions: [executeQuery],
  triggers: [],
}); 