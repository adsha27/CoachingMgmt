import { google } from "googleapis";

// Service account credentials loaded from env.
// Never commit the JSON key file — set GOOGLE_SERVICE_ACCOUNT_KEY as a
// base64-encoded JSON string in .env.local.
function getAuth() {
  const keyJson = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (!keyJson) throw new Error("GOOGLE_SERVICE_ACCOUNT_KEY is not set");

  const key = JSON.parse(Buffer.from(keyJson, "base64").toString("utf-8"));

  // No Workspace/domain-wide delegation: the calendar owner (any Google
  // account, personal Gmail included) shares their calendar directly with
  // this service account's client_email as an editor.
  return new google.auth.JWT({
    email: key.client_email,
    key: key.private_key,
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
}

export interface MeetSession {
  meetLink: string;
  calendarEventId: string;
}

export async function createMeetSession(params: {
  summary: string;
  startTime: Date;
  durationMinutes: number;
  attendeeEmails: string[];
}): Promise<MeetSession> {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });

  const endTime = new Date(
    params.startTime.getTime() + params.durationMinutes * 60 * 1000
  );

  const event = await calendar.events.insert({
    calendarId: process.env.GOOGLE_CALENDAR_OWNER_EMAIL,
    conferenceDataVersion: 1,
    requestBody: {
      summary: params.summary,
      start: { dateTime: params.startTime.toISOString() },
      end: { dateTime: endTime.toISOString() },
      attendees: params.attendeeEmails.map((email) => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `session-${Date.now()}`,
          conferenceSolutionKey: { type: "hangoutsMeet" },
        },
      },
    },
  });

  const meetLink =
    event.data.conferenceData?.entryPoints?.find(
      (ep) => ep.entryPointType === "video"
    )?.uri;

  if (!meetLink) {
    throw new Error(
      "Google Calendar returned no Meet link. Check the owner account has Meet enabled and the calendar is shared with the service account."
    );
  }

  return {
    meetLink,
    calendarEventId: event.data.id!,
  };
}

export async function cancelCalendarEvent(calendarEventId: string) {
  const auth = getAuth();
  const calendar = google.calendar({ version: "v3", auth });
  await calendar.events.delete({
    calendarId: process.env.GOOGLE_CALENDAR_OWNER_EMAIL,
    eventId: calendarEventId,
    sendUpdates: "all",
  });
}
