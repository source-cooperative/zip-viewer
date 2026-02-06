import adapter from "@sveltejs/adapter-static";

export default {
  kit: {
    adapter: adapter({
      pages: "docs",
      assets: "docs",
      fallback: undefined,
      precompress: false,
      strict: true,
    }),
    paths: {
      base: "/zip-viewer",
      relative: false,
    },
  },
};
