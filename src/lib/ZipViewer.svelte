<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import {
    type Entry,
    configure,
    HttpReader,
    ZipReader
  } from "@zip.js/zip.js";
  import { ChevronRight, File, FileArchive, Folder, Download, Loader } from "@lucide/svelte";
  import prettyBytes from "pretty-bytes";

  import clampPrefix from "$lib/clampPrefix";
  import { downloadEntryWithFallback } from "$lib/downloadEntry";
  import getPrefixDepth from "$lib/getPrefixDepth";
  import listZipContents from "$lib/listZipContents";

  let { url }: { url: string } = $props();

  const MAX_BROWSE_DEPTH = 10;
  const MAX_DIRECTORIES_LISTED = 100;
  const MAX_FILES_LISTED = 100;

  configure({ useWebWorkers: true });

  let zipFileUrl = $derived(new URL(url));
  let httpReader = new HttpReader(url, { forceRangeRequests: true });
  let zipReader = new ZipReader(httpReader);

  let entries: Entry[] = $state([]);
  let prefix: string = $state(
    clampPrefix(page.url.searchParams.get("prefix") ?? "", MAX_BROWSE_DEPTH)
  );
  let downloadingFilenames: Set<string> = $state(new Set());

  let breadcrumbs: string[] = $derived(prefix.length > 0 ? prefix.split("/") : []);
  let zipContents = $derived(listZipContents(entries, prefix, MAX_BROWSE_DEPTH));

  let prefixDepth: number = $derived(getPrefixDepth(prefix));

  const getHref = (prefix: string): string => {
    const newUrl = new URL(page.url);
    if (prefix) {
      newUrl.searchParams.set("prefix", prefix);
    } else {
      newUrl.searchParams.delete("prefix");
    }
    return newUrl.toString();
  };

  $effect(() => {
    const urlPrefix = page.url.searchParams.get("prefix") ?? "";
    const clampedPrefix = clampPrefix(urlPrefix, MAX_BROWSE_DEPTH);
    if (clampedPrefix !== prefix) prefix = clampedPrefix;
  });

  onMount(async () => {
    entries = await zipReader.getEntries();
  });

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

<div id="zip-viewer" class="w-full h-full p-4 text-lg font-mono">
  <nav id="zip-breadcrumbs" class="border-b border-source-300 dark:border-source-600 pb-4">
    <ol class="flex flex-row gap-2">
      <li class="shrink-0">
        {#if breadcrumbs.length > 0}
          <a
            href={getHref("")}
            class="text-source-600 dark:text-source-300 group hover:text-inherit cursor-pointer no-underline"
          >
            <FileArchive class="inline-block h-4" />
            <span class="underline hover:no-underline">{zipFileUrl.pathname.split("/").pop()}</span>
          </a>
        {:else}
          <span class="text-source-600 dark:text-source-300">
            <FileArchive class="inline-block h-4" />
            {zipFileUrl.pathname.split("/").pop() ?? "root"}
          </span>
        {/if}
      </li>
      {#each breadcrumbs as breadcrumb}
        <li class="flex-nowrap truncate">
          <ChevronRight class="inline-block h-4" />
          {#if breadcrumb === breadcrumbs[breadcrumbs.length - 1]}
            <span class="text-source-600 dark:text-source-300">
              {breadcrumb}
            </span>
          {:else}
            <a
              href={getHref(breadcrumb)}
              class="text-source-600 dark:text-source-300 group hover:text-inherit cursor-pointer no-underline"
            >
              <span class="underline group-hover:no-underline">{breadcrumb}</span>
            </a>
          {/if}
        </li>
      {/each}
    </ol>
  </nav>
  <div id="zip-contents" class="pt-2">
    <ol>
      {#each zipContents.directories as directory, index}
        {#if index < MAX_DIRECTORIES_LISTED}
          {@const directoryName = directory.split("/").pop()}
          <li class="mt-2 flex flex-row items-center">
            {#if prefixDepth >= MAX_BROWSE_DEPTH}
              <span class="text-source-600 dark:text-source-300">
                <Folder class="inline-block h-4" />
                <span>{directoryName}</span>
              </span>
            {:else}
              <a
                href={getHref(directory)}
                class="group text-source-600 dark:text-source-300 hover:text-inherit cursor-pointer no-underline"
              >
                <ChevronRight class="inline-block h-4" />
                <span class="underline group-hover:no-underline">{directoryName}</span>
              </a>
            {/if}
          </li>
        {/if}
      {/each}
      {#each zipContents.files as file, index}
        {#if index < MAX_FILES_LISTED}
          {@const filename = file.filename.split("/").pop()}
          {@const fileSize = prettyBytes(file.uncompressedSize, {
            maximumFractionDigits: 2
          }).toLocaleUpperCase()}
          <li class="mt-2 flex flex-row gap-4 justify-between items-center">
            <div class="text-source-600 dark:text-source-300 flex-nowrap truncate">
              <File class="inline-block h-4" />
              <span>{filename}</span>
            </div>
            <div class="flex items-center gap-4 shrink-0">
              <div class="text-sm text-source-600 dark:text-source-300 shrink-0">
                {fileSize}
              </div>
              <button
                class="inline-flex items-center gap-1 rounded border border-source-300 px-2 py-1 text-xs text-source-600 hover:text-inherit hover:border-source-400 dark:border-source-600 dark:text-source-300 dark:hover:border-source-500 disabled:cursor-not-allowed disabled:opacity-60 cursor-pointer"
                onclick={() => downloadEntry(file)}
                disabled={downloadingFilenames.has(file.filename)}
              >
                {#if downloadingFilenames.has(file.filename)}
                  <Loader class="h-3 animate-spin" />
                {:else}
                  <Download class="h-3" />
                {/if}
              </button>
            </div>
          </li>
        {:else if index === MAX_FILES_LISTED}
          <li class="mt-2 flex flex-row items-center">
            <div class="text-source-600 dark:text-source-300">
              <File class="inline-block h-4" />
              <span>…</span>
            </div>
          </li>
        {/if}
      {/each}
    </ol>
  </div>
</div>
