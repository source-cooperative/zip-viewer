<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import {
    type Entry,
    configure,
    HttpReader,
    ZipReader
  } from "@zip.js/zip.js";
  import { ChevronRight, File, FileArchive } from "@lucide/svelte";
  import prettyBytes from "pretty-bytes";

  import listZipContents from "$lib/listZipContents";

  let { url } = $props();

  configure({ useWebWorkers: true });

  let zipFileUrl = $derived(new URL(url));
  let httpReader = new HttpReader(url);
  let zipReader = new ZipReader(httpReader);

  let entries: Entry[] = $state([]);
  let prefix: string = $state(page.url.searchParams.get("prefix") ?? "");

  let breadcrumbs: string[] = $derived(prefix.length > 0 ? prefix.split("/") : []);
  let results = $derived(listZipContents(entries, prefix));

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
    if (urlPrefix !== prefix) prefix = urlPrefix;
  });

  onMount(async () => {
    entries = await zipReader.getEntries();
    results = listZipContents(entries, prefix);
  });
</script>

<div class="w-full h-full p-4 bg-source-100 dark:bg-source-900 text-lg font-mono">
  <nav
    class="text-source-600 dark:text-source-300 border-b border-source-300 dark:border-source-600 pb-4"
  >
    <ol class="flex flex-row gap-2">
      <li class="shrink-0">
        {#if breadcrumbs.length > 0}
          <a href={getHref("")} class="group hover:text-inherit cursor-pointer no-underline">
            <FileArchive class="inline-block h-4" />
            <span class="underline hover:no-underline">{zipFileUrl.pathname.split("/").pop()}</span>
          </a>
        {:else}
          <span>
            <FileArchive class="inline-block h-4" />
            {zipFileUrl.pathname.split("/").pop() ?? "root"}
          </span>
        {/if}
      </li>
      {#each breadcrumbs as breadcrumb}
        <li class="flex-nowrap truncate">
          <ChevronRight class="inline-block h-4" />
          {#if breadcrumb === breadcrumbs[breadcrumbs.length - 1]}
            <span>
              {breadcrumb}
            </span>
          {:else}
            <a
              href={getHref(breadcrumb)}
              class="group hover:text-inherit cursor-pointer no-underline"
              tabindex="-1"
            >
              <span class="underline group-hover:no-underline">{breadcrumb}</span>
            </a>
          {/if}
        </li>
      {/each}
    </ol>
  </nav>
  <div class="pt-2">
    <ol>
      {#each results.directories as directory}
        <li class="mt-2 flex flex-row items-center">
          <a
            href={getHref(directory)}
            class="group text-source-600 dark:text-source-300 hover:text-inherit cursor-pointer no-underline"
          >
            <ChevronRight class="inline-block h-4" />
            <span class="underline group-hover:no-underline">{directory.split("/").pop()}</span>
          </a>
        </li>
      {/each}
      {#each results.files as file}
        {@const filename = file.filename.split("/").pop()}
        {@const fileSize = prettyBytes(file.uncompressedSize, { maximumFractionDigits: 2 })}
        <li class="mt-2 flex flex-row gap-4 justify-between items-center">
          <div class="text-source-600 dark:text-source-300 flex-nowrap truncate">
            <File class="inline-block h-4" />
            {filename}
          </div>
          <div class="text-sm text-source-600 dark:text-source-300 shrink-0">
            {fileSize.toLocaleUpperCase()}
          </div>
        </li>
      {/each}
    </ol>
  </div>
</div>
