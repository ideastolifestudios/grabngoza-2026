const API_BASE = "https://runtime.codewords.ai/run";
const SERVICE_ID = "sizabantu_calendar_booking_9a021c41";
const API_KEY = process.env.NEXT_PUBLIC_CODEWORDS_API_KEY;

export interface TimeSlot {
  start: string;
  end: string;
  available: boolean;
}
