import { describe, expect, it } from "vitest";

import { clampPrefix, getPrefixDepth, listZipContents } from "./utilities";

describe("utilities", () => {
  describe("clampPrefix", () => {
    it("should clamp prefix to max depth", () => {
      expect(
        clampPrefix("a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p/q/r/s/t/u/v/w/x/y/z", 10),
      ).toBe("a/b/c/d/e/f/g/h/i/j");
    });

    it("should return empty string if prefix is empty", () => {
      expect(clampPrefix("", 10)).toBe("");
    });

    it("should return prefix if it is shorter than max depth", () => {
      expect(clampPrefix("a/b/c/d/e/f/g/h/i", 10)).toBe("a/b/c/d/e/f/g/h/i");
    });

    it("should return prefix if it is equal to max depth", () => {
      expect(clampPrefix("a/b/c/d/e/f/g/h/i/j", 10)).toBe("a/b/c/d/e/f/g/h/i/j");
    });
  });

  describe("getPrefixDepth", () => {
    it("should return the depth of the prefix", () => {
      expect(getPrefixDepth("a/b/c/d/e/f/g/h/i/j")).toBe(10);
      expect(getPrefixDepth("a/b/c/d/e")).toBe(5);
    });

    it("should return the depth of the prefix with a trailing slash", () => {
      expect(getPrefixDepth("a/b/c/d/e/f/g/h/i/j/")).toBe(10);
      expect(getPrefixDepth("a/b/c/d/e/")).toBe(5);
    });

    it("should return 0 for an empty prefix", () => {
      expect(getPrefixDepth("")).toBe(0);
    });
  });

  describe("listZipContents", () => {
    it("should list the contents of a ZIP entries array", async () => {
      const entries = [
        { filename: "dir1/file1.txt", directory: false },
        { filename: "dir1/file2.txt", directory: false },
        { filename: "dir1/dir2/file3.txt", directory: false },
        { filename: "dir1/dir2/dir3/file4.txt", directory: false },
        { filename: "file5.txt", directory: false },
        { filename: "dir1/dir2/file6.txt", directory: false },
        { filename: "dir4/file7.txt", directory: false },
      ];

      // @ts-expect-error
      const { directories, files } = listZipContents(entries, "", 10);

      expect(directories).toEqual(["dir1", "dir4"]);
      expect(files).toEqual([{ filename: "file5.txt", directory: false }]);
    });

    it("should list the contents of a ZIP entries array with a prefix", async () => {
      const entries = [
        { filename: "dir1/file1.txt", directory: false },
        { filename: "dir1/file2.txt", directory: false },
        { filename: "dir1/dir2/file3.txt", directory: false },
        { filename: "dir1/dir2/dir3/file4.txt", directory: false },
      ];

      // @ts-expect-error
      const { directories, files } = listZipContents(entries, "dir1", 10);

      expect(directories).toEqual(["dir1/dir2"]);
      expect(files).toEqual([
        { filename: "dir1/file1.txt", directory: false },
        { filename: "dir1/file2.txt", directory: false },
      ]);
    });

    it("should list the contents of a ZIP entries array with a prefix and a max depth", async () => {
      const entries = [
        { filename: "dir1/dir2/file1.txt", directory: false },
        { filename: "dir1/dir2/file2.txt", directory: false },
        { filename: "dir1/dir2/dir3/file3.txt", directory: false },
      ];

      // @ts-expect-error
      const { directories, files } = listZipContents(entries, "dir1/dir2/dir3", 2);

      expect(directories).toEqual(["dir1/dir2/dir3"]);
      expect(files).toEqual([
        { filename: "dir1/dir2/file1.txt", directory: false },
        { filename: "dir1/dir2/file2.txt", directory: false },
      ]);
    });
  });
});
