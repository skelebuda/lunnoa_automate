import {
  createDynamicSelectInputField,
} from '@lunnoa-automate/toolkit';

export const shared = {
  mondayApiRequest: async ({
    http,
    workspaceId,
    connection,
    query,
    variables,
  }: {
    http: any;
    workspaceId: string;
    connection: any;
    query: string;
    variables?: Record<string, any>;
  }) => {
    const response = await http.request({
      method: 'POST',
      url: 'https://api.monday.com/v2',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${connection.accessToken}`,
      },
      data: {
        query,
        variables,
      },
      workspaceId,
    });

    if (response.data.errors) {
      throw new Error(
        `Monday API Error: ${JSON.stringify(response.data.errors)}`,
      );
    }

    return response.data.data;
  },
  fields: {
    dynamicSelectBoard: createDynamicSelectInputField({
      id: 'boardId',
      label: 'Board',
      description: 'Select a board',
      required: {
        missingMessage: 'Board is required',
        missingStatus: 'warning',
      },
      _getDynamicValues: async ({ http, workspaceId, connection }) => {
        const query = `query { boards { id name } }`;
        const data = await shared.mondayApiRequest({
          http,
          workspaceId,
          connection,
          query,
        });

        return data.boards.map((board: { id: string; name: string }) => ({
          label: board.name,
          value: board.id,
        }));
      },
    }),
    dynamicSelectUser: createDynamicSelectInputField({
      id: 'userId',
      label: 'User',
      description: 'Select a user to assign the task to',
      required: {
        missingMessage: 'User is required',
        missingStatus: 'warning',
      },
      _getDynamicValues: async ({ http, workspaceId, connection }) => {
        const query = `query { users { id name } }`;
        const data = await shared.mondayApiRequest({
          http,
          workspaceId,
          connection,
          query,
        });

        return data.users.map((user: { id: string; name: string }) => ({
          label: user.name,
          value: user.id,
        }));
      },
    }),
    dynamicSelectPersonColumn: createDynamicSelectInputField({
      id: 'personColumnId',
      label: 'Person Column',
      description: 'Select the person column to search for the user.',
      required: {
        missingMessage: 'Person column is required',
        missingStatus: 'warning',
      },
      loadOptions: {
        dependsOn: ['boardId'],
      },
      _getDynamicValues: async ({
        http,
        workspaceId,
        connection,
        extraOptions,
      }) => {
        const boardId = extraOptions?.boardId as string;
        if (!boardId) return [];

        const query = `query($boardId: ID!) {
          boards(ids: [$boardId]) {
            columns(types: [people]) {
              id
              title
            }
          }
        }`;
        const variables = { boardId: Number(boardId) };

        const data = await shared.mondayApiRequest({
          http,
          workspaceId,
          connection,
          query,
          variables,
        });

        if (!data.boards || data.boards.length === 0) {
          return [];
        }

        return data.boards[0].columns.map(
          (column: { id: string; title: string }) => ({
            label: column.title,
            value: column.id,
          }),
        );
      },
    }),
    dynamicSelectStatus: createDynamicSelectInputField({
      id: 'status',
      label: 'Status',
      description: 'Select a status to filter tasks',
      loadOptions: {
        dependsOn: ['boardId'],
      },
      _getDynamicValues: async ({
        http,
        workspaceId,
        connection,
        extraOptions,
      }) => {
        const boardId = extraOptions?.boardId as string;
        if (!boardId) return [];

        const query = `query($boardId: ID!) {
          boards(ids: [$boardId]) {
            columns(types: [status]) {
              id
              title
              settings_str
            }
          }
        }`;
        const variables = { boardId: Number(boardId) };

        const data = await shared.mondayApiRequest({
          http,
          workspaceId,
          connection,
          query,
          variables,
        });

        if (!data.boards || data.boards.length === 0) {
          return [];
        }

        const options: { label: string; value: string }[] = [];
        const columns = data.boards[0].columns;

        for (const column of columns) {
          const settings = JSON.parse(column.settings_str);
          if (settings && settings.labels) {
            for (const index in settings.labels) {
              const label = settings.labels[index];
              options.push({
                label: `${column.title}: ${label}`,
                value: `${column.id}|${label}`,
              });
            }
          }
        }

        return options;
      },
    }),
  },
};
