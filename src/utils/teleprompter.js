export function getReadingContent(newsItem) {
  return JSON.stringify([
    newsItem?.title || "",
    newsItem?.script?.trim() || newsItem?.summary?.trim() || "",
    newsItem?.selectedLowerThird || "",
  ]);
}
