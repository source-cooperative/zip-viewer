const clampPrefix = (prefix: string, maxDepth: number): string => {
  const parts = prefix.split("/").filter(Boolean);
  if (parts.length <= maxDepth) return prefix;
  return parts.slice(0, maxDepth).join("/");
};

export default clampPrefix;
