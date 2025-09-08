import { createAction, createDateInputField, createNumberInputField} from '@lunnoa-automate/toolkit';
import { z } from 'zod';

export const retrieveMeetings = createAction({
  id: 'guidepoint_action_retrieve-meetings',
  name: 'Retrieve Meetings',
  description: 'Retrieves meetings from Guidepoint API, filtering by start and end date. The response contains URLs to the transcripts and recordings.',
  inputConfig: [
    createDateInputField({
      id: 'start_date',
      label: 'Start Date',
      description: 'Start date to filter meetings (UTC)',
      placeholder: 'YYYY-MM-DD',
      required: {
        missingMessage: 'Start date is required',
        missingStatus: 'warning',
      },
    }),
    createDateInputField({
      id: 'end_date',
      label: 'End Date',
      description: 'End date to filter meetings (UTC)',
      placeholder: 'YYYY-MM-DD',
      required: {
        missingMessage: 'End date is required',
        missingStatus: 'warning',
      },
    }),
    createNumberInputField({
      id: 'per_page',
      label: 'Results Per Page',
      description: 'Number of results per page',
      placeholder: '25',
    }),
    createNumberInputField({
      id: 'page',
      label: 'Page Number',
      description: 'Page number for pagination',
      placeholder: '1',
    }),
  ],
  aiSchema: z.object({
    start_date: z.string().describe('Start date to filter meetings (UTC)'),
    end_date: z.string().describe('End date to filter meetings (UTC)'),
    per_page: z.number().optional().describe('Number of results per page'),
    page: z.number().optional().describe('Page number for pagination'),
  }),
  run: async ({ configValue, connection, workspaceId, http }) => {
    const { start_date, end_date, per_page, page } = configValue;
    const url = `https://clapi.guidepoint.io/expertnetwork-content-api/v1/meetings`;

    try {
      console.log(`[GUIDEPOINT DEBUG] Making request to ${url} with API key...`);
      const result = await http.request({
        method: 'GET',
        url,
        params: {
          start_date,
          end_date,
          per_page,
          page,
        },
        headers: {
          'Subscription-Key': connection.apiKey,
          'Content-Type': 'application/json',
        },
        workspaceId,
      });

      console.log(`[GUIDEPOINT DEBUG] Request successful`);
      if (result?.data) {
        return result.data;
      } else {
        throw new Error('No meetings found');
      }
    } catch (error) {
      console.log(`[GUIDEPOINT DEBUG] Request failed:`, {
        message: error.message,
        status: error?.status,
        responseStatus: error?.response?.status,
        responseData: JSON.stringify(error?.response?.data),
      });
      throw error;
    }
  },
  mockRun: async () => {
    return {
      meetings: [
        {
          id: 'ABCD1234-5678-90EF-GHIJ-KLMNOPQRSTUV',
          start_time: '2025-02-18T12:30:00.0000',
          title: 'Market Trends and Analysis',
          case_code: 'CASE12345.1.2',
          deal_code: null,
          angle: 'Industry Expert',
          advisor: {
            first_name: 'John',
            last_name: 'Doe',
          },
          client: {
            first_name: 'Jane',
            middle_initial: null,
            last_name: 'Smith',
            email: 'jane.smith@example.com',
          },
          recording: {
            url: 'https://storage.example.com/recordings/abcd1234',
          },
          transcription: {
            url: 'https://storage.example.com/transcriptions/abcd1234.docx',
            json_url: 'https://storage.example.com/transcriptions/abcd1234.json',
          },
        },
      ],
    };
  },
});
