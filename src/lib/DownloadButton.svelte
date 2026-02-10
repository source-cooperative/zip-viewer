<script lang="ts">
  import type { Entry } from "@zip.js/zip.js";
  import { Download, Loader } from "@lucide/svelte";

  import { downloadEntryWithFallback } from "$lib/downloadEntry";

  let { file, downloadingFilenames }: { file: Entry; downloadingFilenames: Set<string> } = $props();

  const downloadEntry = async (entry: Entry): Promise<void> => {
    if (entry.directory) return;

    const { filename } = entry;
    if (downloadingFilenames.has(filename)) return;

    const nextDownloading = new Set(downloadingFilenames);
    nextDownloading.add(filename);
    downloadingFilenames = nextDownloading;

    try {
      await downloadEntryWithFallback(entry);
    } finally {
      const cleaned = new Set(downloadingFilenames);
      cleaned.delete(filename);
      downloadingFilenames = cleaned;
    }
  };
</script>

<button
  class="inline-flex items-center gap-1 rounded border border-source-300 px-2 py-1 text-sm text-source-600 hover:text-inherit hover:border-source-400 dark:border-source-600 dark:text-source-300 dark:hover:border-source-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
  onclick={() => downloadEntry(file)}
  disabled={downloadingFilenames.has(file.filename)}
>
  {#if downloadingFilenames.has(file.filename)}
    <Loader class="h-3 motion-safe:animate-spin" />
  {:else}
    <Download class="h-3" />
  {/if}
</button>
