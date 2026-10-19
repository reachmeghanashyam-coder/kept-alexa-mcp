import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const deadlineIso =
    searchParams.get('deadline') || '2026-11-17T23:59:59.000Z';
  const location =
    searchParams.get('location') || 'Whole Foods Market (Customer Service Desk)';

  const deadlineDate = new Date(deadlineIso);

  // Format date in UTC for ICS: YYYYMMDDTHHMMSSZ
  const formatDateToICS = (date: Date) => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const dtStart = formatDateToICS(deadlineDate);
  const dtEnd = formatDateToICS(new Date(deadlineDate.getTime() + 60 * 60 * 1000));
  const now = formatDateToICS(new Date());

  const icsContent = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Kept//Alexa+ Commerce Bridge//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:kept_deadline_${deadlineDate.getTime()}@kept.internal`,
    `DTSTAMP:${now}`,
    `DTSTART:${dtStart}`,
    `DTEND:${dtEnd}`,
    `SUMMARY:Kept: Return Deadline for Order #842 (Whole Foods)`,
    `DESCRIPTION:Consolidated drop-off deadline for Cosori Glass Kettle (Replacement) and State Cashmere Sweater (Return).\\n\\nLocation: ${location}\\nRequirement: Box-Free & Label-Free. Present digital return pass at customer service desk.`,
    `LOCATION:${location}`,
    'STATUS:CONFIRMED',
    'BEGIN:VALARM',
    'TRIGGER:-P1D',
    'ACTION:DISPLAY',
    'DESCRIPTION:Reminder: Kept return window closes in 24 hours',
    'END:VALARM',
    'END:VEVENT',
    'END:VCALENDAR',
  ].join('\r\n');

  return new NextResponse(icsContent, {
    status: 200,
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'attachment; filename="kept-return-deadline.ics"',
    },
  });
}
