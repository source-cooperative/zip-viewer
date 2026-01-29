const getPrefixDepth = (prefix: string): number => prefix.split("/").filter(Boolean).length;

export default getPrefixDepth;
