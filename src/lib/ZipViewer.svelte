<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { type Entry, configure, HttpReader, ZipReader } from "@zip.js/zip.js";
  import { ChevronRight, File, Folder } from "@lucide/svelte";
  import prettyBytes from "pretty-bytes";

  import Breadcrumbs from "$lib/Breadcrumbs.svelte";
  import DownloadButton from "$lib/DownloadButton.svelte";
  import { clampPrefix, getPrefixDepth, listZipContents } from "$lib/utilities";

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
</script>

<div id="zip-viewer" class="w-full h-full p-4 text-xl font-mono">
  <Breadcrumbs prefix={prefix} getHref={getHref} zipFileUrl={zipFileUrl} />
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
              <div class="text-base text-source-600 dark:text-source-300 shrink-0">
                {fileSize}
              </div>
              <DownloadButton file={file} downloadingFilenames={downloadingFilenames} />
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
