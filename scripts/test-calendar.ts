/**
 * Day 0 prototype: verify Google Calendar service account can provision
 * a Google Meet link. Run this BEFORE writing any other platform code.
 *
 * Prerequisites:
 *   1. Google Workspace Business Starter+ account
 *   2. Service account created in Google Cloud Console
 *   3. Domain-wide delegation enabled:
 *      Admin Console → Security → API Controls → Domain-wide Delegation
 *      Add scopes: https://www.googleapis.com/auth/calendar
 *   4. Service account key downloaded as JSON
 *
 * Setup:
 *   base64 -i path/to/service-account-key.json | pbcopy
 *   Then paste into .env.local as GOOGLE_SERVICE_ACCOUNT_KEY=<paste>
 *
 * Run:
 *   npx tsx scripts/test-calendar.ts
 */

import { createMeetSession } from "../lib/calendar";
import * as dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

async function main() {
  console.log("Testing Google Calendar service account Meet provisioning...\n");

  // Test session 15 minutes from now, 60 minutes long
  const startTime = new Date(Date.now() + 15 * 60 * 1000);

  try {
    const result = await createMeetSession({
      summary: "[TEST] Calendar API Prototype",
      startTime,
      durationMinutes: 60,
      attendeeEmails: [
        process.env.GOOGLE_CALENDAR_OWNER_EMAIL ?? "test@example.com",
      ],
    });

    console.log("✓ SUCCESS\n");
    console.log("Meet link:        ", result.meetLink);
    console.log("Calendar event ID:", result.calendarEventId);
    console.log("\nPhase 1 is unblocked. Delete this test event from Google Calendar.");
  } catch (err) {
    console.error("✗ FAILED\n");
    console.error(err instanceof Error ? err.message : err);
    console.error("\nCommon causes:");
    console.error("  - GOOGLE_SERVICE_ACCOUNT_KEY not set or malformed");
    console.error("  - Domain-wide delegation not enabled in Workspace Admin Console");
    console.error("  - Service account missing Calendar API scope");
    console.error("  - Workspace plan does not support Meet (requires Business Starter+)");
    process.exit(1);
  }
}

main();
