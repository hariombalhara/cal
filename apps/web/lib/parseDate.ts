import type { I18n } from "next-i18next";
import { RRule } from "rrule";

import type { Dayjs } from "@calcom/dayjs";
import dayjs from "@calcom/dayjs";
import type { TimeFormat } from "@calcom/lib/timeFormat";
import { detectBrowserTimeFormat } from "@calcom/lib/timeFormat";
import type { RecurringEvent } from "@calcom/types/Calendar";

import { parseZone } from "./parseZone";

const processDate = (date: string | null | Dayjs, i18n: I18n, selectedTimeFormat?: TimeFormat) => {
  const parsedZone = parseZone(date);
  if (!parsedZone?.isValid()) return "Invalid date";
  const formattedTime = parsedZone?.format(selectedTimeFormat || detectBrowserTimeFormat);
  return formattedTime + ", " + dayjs(date).toDate().toLocaleString(i18n.language, { dateStyle: "full" });
};

export const parseDate = (date: string | null | Dayjs, i18n: I18n, selectedTimeFormat?: TimeFormat) => {
  if (!date) return ["No date"];
  return processDate(date, i18n, selectedTimeFormat);
};

export const parseRecurringDates = (
  {
    startDate,
    timeZone,
    recurringEvent,
    recurringCount,
    selectedTimeFormat,
  }: {
    startDate: string | null | Dayjs;
    timeZone?: string;
    recurringEvent: RecurringEvent | null;
    recurringCount: number;
    selectedTimeFormat?: TimeFormat;
  },
  i18n: I18n
): [string[], Date[]] => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { count, ...restRecurringEvent } = recurringEvent || {};
  const rule = new RRule({
    ...restRecurringEvent,
    count: recurringCount,
    dtstart: new Date(dayjs(startDate).valueOf()),
  });

  const startUtcOffset = dayjs(startDate).utcOffset();
  // UTC still need to have DST applied, rrule does not do this.
  const times = rule.all().map((t) => {
    // applying the DST offset.
    return dayjs.utc(t).add(startUtcOffset - dayjs(t).utcOffset(), "minute");
  });
  const dateStrings = times.map((t) => {
    // finally; show in local timeZone again
    return processDate(t.tz(timeZone), i18n, selectedTimeFormat);
  });

  return [dateStrings, times.map((t) => t.toDate())];
};
