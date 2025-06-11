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
  },
};
