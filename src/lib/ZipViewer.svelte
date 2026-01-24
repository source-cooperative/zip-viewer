<script lang="ts">
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import { type Entry, HttpReader, ZipReader } from "@zip.js/zip.js";
  import { ChevronRight, File } from "@lucide/svelte";
  import prettyBytes from "pretty-bytes";

  import listZipContents from "$lib/listZipContents";

  let { url } = $props();

  let httpReader = new HttpReader(url);
  let zipReader = new ZipReader(httpReader);

  let entries: Entry[] = $state([]);
  let prefix: string = $state(page.url.searchParams.get("prefix") ?? "");

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

<div class="w-full h-full p-6">
  <ol class="text-lg font-mono">
    {#each results.directories as directory}
      <li class="mb-2 flex flex-row justify-between">
        <a
          href={getHref(directory)}
          class="group text-source-600 dark:text-source-300 hover:text-inherit cursor-pointer no-underline"
          tabindex="-1"
        >
          <ChevronRight class="inline-block" />
          <span class="underline group-hover:no-underline">{directory.split("/").pop()}</span>
        </a>
      </li>
    {/each}
    {#each results.files as file}
      {@const fileSize = prettyBytes(file.compressedSize, { maximumFractionDigits: 2 })}
      <li class="mb-2 flex flex-row justify-between">
        <div>
          <File class="inline-block" />
          {file.filename.split("/").pop()}
        </div>
        <div class="text-sm text-source-600 dark:text-source-300">
          {fileSize.toLocaleUpperCase()}
        </div>
      </li>
    {/each}
  </ol>
</div>
