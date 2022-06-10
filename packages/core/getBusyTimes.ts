import { BookingStatus, Credential, SelectedCalendar } from "@prisma/client";

import { getBusyCalendarTimes } from "@calcom/core/CalendarManager";
import { getBusyVideoTimes } from "@calcom/core/videoClient";
import notEmpty from "@calcom/lib/notEmpty";
import prisma from "@calcom/prisma";
import type { EventBusyDate } from "@calcom/types/Calendar";

export async function getBusyTimes(params: {
  credentials: Credential[];
  userId: number;
  eventTypeId?: number;
  startTime: string;
  endTime: string;
  selectedCalendars: SelectedCalendar[];
}) {
  const { credentials, userId, eventTypeId, startTime, endTime, selectedCalendars } = params;
  const busyTimes: EventBusyDate[] = await prisma.booking
    .findMany({
      where: {
        userId,
        eventTypeId,
        startTime: { gte: new Date(startTime) },
        endTime: { lte: new Date(endTime) },
        status: {
          in: [BookingStatus.ACCEPTED],
        },
      },
      select: {
        startTime: true,
        endTime: true,
      },
    })
    .then((bookings) => bookings.map(({ startTime, endTime }) => ({ end: endTime, start: startTime })));

  if (credentials) {
    const calendarBusyTimes = await getBusyCalendarTimes(credentials, startTime, endTime, selectedCalendars);
    busyTimes.push(...calendarBusyTimes);
    const videoBusyTimes = (await getBusyVideoTimes(credentials)).filter(notEmpty);
    busyTimes.push(...videoBusyTimes);
  }

  return busyTimes;
}

export default getBusyTimes;