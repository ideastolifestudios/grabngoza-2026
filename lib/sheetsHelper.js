import { sheets } from './googleClient.js';

export async function appendToSheet(spreadsheetId, range, values) {
  try {
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [values],
      },
    });
    return response.data;
  } catch (error) {
    console.error('Google Sheets API Error:', error);
    throw error;
  }
}
