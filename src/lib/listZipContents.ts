import type { Entry } from "@zip.js/zip.js";

const listZipContents = (
  entries: Entry[],
  prefix: string,
): { directories: string[]; files: Entry[] } => {
  if (prefix.length > 0 && !prefix.endsWith("/")) prefix += "/";

  const files: Entry[] = [];
  const directories = new Set<string>();

  for (const entry of entries) {
    if (!entry.filename.startsWith(prefix)) continue;

    const remainder = entry.filename.slice(prefix.length);
    if (remainder.length === 0) continue;

    const slashIndex = remainder.indexOf("/");
    if (slashIndex === -1) {
      if (!entry.directory) files.push(entry);
    } else {
      const filename = remainder.slice(0, slashIndex);
      const filepath = `${prefix}${filename}`;
      directories.add(filepath);
    }
  }

  return {
    directories: [...directories].sort(),
    files: files.sort((a, b) => a.filename.localeCompare(b.filename)),
  };
};

export default listZipContents;
