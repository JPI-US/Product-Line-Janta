/** Chicago-time helpers without luxon (for marketing mock data). */

export type ZonedParts = {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
};

export function getZonedParts(date: Date, timeZone: string): ZonedParts {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: false,
  });

  const parts: Record<string, number> = {};
  for (const p of formatter.formatToParts(date)) {
    if (p.type === "literal") continue;
    let value = Number(p.value);
    if (p.type === "hour" && value === 24) value = 0;
    parts[p.type] = value;
  }

  return {
    year: parts.year ?? 0,
    month: parts.month ?? 1,
    day: parts.day ?? 1,
    hour: parts.hour ?? 0,
    minute: parts.minute ?? 0,
    second: parts.second ?? 0,
  };
}

export function hourDecimal(date: Date, timeZone: string) {
  const p = getZonedParts(date, timeZone);
  return p.hour + p.minute / 60 + p.second / 3600;
}

export function daysInMonth(date: Date, timeZone: string) {
  const { year, month } = getZonedParts(date, timeZone);
  return new Date(year, month, 0).getDate();
}

export function minutesSinceMidnight(date: Date, timeZone: string) {
  const p = getZonedParts(date, timeZone);
  return p.hour * 60 + p.minute;
}
