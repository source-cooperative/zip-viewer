import type { Entry, FileEntry } from "@zip.js/zip.js";

import clampPrefix from "$lib/clampPrefix";
import getPrefixDepth from "$lib/getPrefixDepth";

const listZipContents = (
  entries: Entry[],
  prefix: string,
  maxDepth: number,
): { directories: string[]; files: FileEntry[] } => {
  const prefixClamped = clampPrefix(prefix, maxDepth);
  const prefixCanonical =
    prefixClamped.length > 0 && !prefixClamped.endsWith("/")
      ? `${prefixClamped}/`
      : prefixClamped;

  const files: FileEntry[] = [];
  const directories = new Set<string>();

  for (const entry of entries) {
    if (!entry.filename.startsWith(prefixCanonical)) continue;

    const remainder = entry.filename.slice(prefixCanonical.length);
    if (remainder.length === 0) continue;

    const slashIndex = remainder.indexOf("/");
    if (slashIndex === -1) {
      if (!entry.directory) files.push(entry);
    } else {
      const filename = remainder.slice(0, slashIndex);
      const filepath = `${prefixCanonical}${filename}`;
      if (getPrefixDepth(filepath) <= maxDepth + 1) directories.add(filepath);
    }
  }

  return {
    directories: [...directories].sort(),
    files: files.sort((a, b) => a.filename.localeCompare(b.filename)),
  };
};

export default listZipContents;
