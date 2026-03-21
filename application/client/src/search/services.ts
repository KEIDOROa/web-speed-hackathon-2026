export const sanitizeSearchText = (input: string): string => {
  let text = input;

  text = text.replace(
    /\b(from|until)\s*:?\s*(\d{4}-\d{2}-\d{2})\d*/gi,
    (_m, key, date) => `${key}:${date}`,
  );

  return text;
};

export const parseSearchQuery = (query: string) => {
  const sincePattern = /since:(\d{4}-\d{2}-\d{2})/;
  const untilPattern = /until:(\d{4}-\d{2}-\d{2})/;

  const sinceMatch = sincePattern.exec(query);
  const untilMatch = untilPattern.exec(query);

  const keywords = query
    .replace(/since:\d{4}-\d{2}-\d{2}/g, "")
    .replace(/until:\d{4}-\d{2}-\d{2}/g, "")
    .trim()
    .replace(/\s+/g, " ");

  return {
    keywords,
    sinceDate: sinceMatch?.[1] ?? null,
    untilDate: untilMatch?.[1] ?? null,
  };
};

export const isValidDate = (dateStr: string): boolean => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    return false;
  }
  const date = new Date(dateStr);
  return !Number.isNaN(date.getTime());
};
