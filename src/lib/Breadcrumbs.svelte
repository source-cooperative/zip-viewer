<script lang="ts">
  import { ChevronRight, FileArchive } from "@lucide/svelte";

  let {
    prefix,
    getHref,
    zipFileUrl
  }: { prefix: string; getHref: (prefix: string) => string; zipFileUrl: URL } = $props();

  let breadcrumbs: string[] = $derived(prefix.length > 0 ? prefix.split("/") : []);
</script>

<nav id="zip-breadcrumbs" class="border-b border-source-300 dark:border-source-600 pb-4">
  <ol class="flex flex-row gap-2">
    <li class="shrink-0">
      {#if breadcrumbs.length > 0}
        <a
          href={getHref("")}
          class="text-source-600 dark:text-source-300 group hover:text-inherit cursor-pointer no-underline"
        >
          <FileArchive class="inline-block h-8" />
          <span class="underline hover:no-underline">{zipFileUrl.pathname.split("/").pop()}</span>
        </a>
      {:else}
        <span class="text-source-600 dark:text-source-300">
          <FileArchive class="inline-block h-8" />
          {zipFileUrl.pathname.split("/").pop() ?? "root"}
        </span>
      {/if}
    </li>
    {#each breadcrumbs as breadcrumb}
      <li class="flex-nowrap truncate">
        <ChevronRight class="inline-block h-8" />
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
