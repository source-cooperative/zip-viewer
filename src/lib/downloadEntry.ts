import { BlobWriter, getMimeType, type Entry } from "@zip.js/zip.js";

type FileSystemWritableFileStream = WritableStream & {
  close: () => Promise<void>;
  abort?: (reason?: unknown) => Promise<void>;
};

type FileSystemFileHandle = {
  createWritable: () => Promise<FileSystemWritableFileStream>;
};

type StreamAttempt = "success" | "cancelled" | "unsupported" | "error";
type DownloadMethod = "filesystem" | "streamsaver" | "blob" | "cancelled";

const logDebug = (...args: unknown[]): void => {
  console.debug("[zip-viewer][download]", ...args);
};

const getDownloadName = (filename: string): string => filename.split("/").pop();

const streamEntryToDisk = async (entry: Entry): Promise<StreamAttempt> => {
  if (entry.directory) return "unsupported";
  if (typeof window === "undefined") return "unsupported";
  if (!window.isSecureContext) {
    logDebug("FileSystemAccess unavailable: insecure context.");
    return "unsupported";
  }

  const picker = (
    window as Window & {
      showSaveFilePicker?: (options?: {
        suggestedName?: string;
      }) => Promise<FileSystemFileHandle>;
    }
  ).showSaveFilePicker;

  if (!picker) {
    logDebug("FileSystemAccess unavailable: showSaveFilePicker missing.");
    return "unsupported";
  }

  let writable: FileSystemWritableFileStream | null = null;

  try {
    logDebug("Attempting File System Access stream.");
    const handle = await picker({ suggestedName: getDownloadName(entry.filename) });
    writable = await handle.createWritable();
    await entry.getData(writable);
    await writable.close();
    return "success";
  } catch (error) {
    try {
      await writable?.abort?.(error);
    } catch {
      // Ignore cleanup failures and fall back to blob when appropriate.
    }
    if (error instanceof DOMException && error.name === "AbortError") {
      logDebug("File System Access save cancelled by user.");
      return "cancelled";
    }
    logDebug("File System Access stream failed.", error);
    return "error";
  }
};

const streamEntryWithStreamSaver = async (entry: Entry): Promise<StreamAttempt> => {
  if (entry.directory) return "unsupported";
  if (typeof window === "undefined") return "unsupported";
  if (!window.isSecureContext) {
    logDebug("StreamSaver unavailable: insecure context.");
    return "unsupported";
  }

  try {
    const [mitmResponse, swResponse] = await Promise.all([
      fetch("/streamsaver/mitm.html", { method: "HEAD" }),
      fetch("/streamsaver/sw.js", { method: "HEAD" }),
    ]);
    if (!mitmResponse.ok || !swResponse.ok) {
      logDebug("StreamSaver assets missing; skipping StreamSaver.");
      return "unsupported";
    }

    const { default: streamSaver } = await import("streamsaver");
    if (!streamSaver?.supported) {
      logDebug("StreamSaver reports unsupported environment.");
      return "unsupported";
    }
    streamSaver.mitm = "/streamsaver/mitm.html";

    logDebug("Attempting StreamSaver stream.");
    const fileStream = streamSaver.createWriteStream(getDownloadName(entry.filename), {
      size: entry.uncompressedSize || undefined,
    });

    await entry.getData(fileStream);
    return "success";
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      logDebug("StreamSaver save cancelled by user.");
      return "cancelled";
    }
    logDebug("StreamSaver stream failed.", error);
    return "error";
  }
};

const downloadEntryAsBlob = async (entry: Entry): Promise<void> => {
  const mimeType = getMimeType(entry.filename);
  const blob = await entry.getData(new BlobWriter(mimeType));
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = objectUrl;
  anchor.download = getDownloadName(entry.filename);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
};

export const downloadEntryWithFallback = async (entry: Entry): Promise<DownloadMethod> => {
  if (entry.directory) return "cancelled";

  const fileSystemAttempt = await streamEntryToDisk(entry);
  if (fileSystemAttempt === "success") {
    logDebug("Downloading via file-system stream.");
    return "filesystem";
  }
  if (fileSystemAttempt === "cancelled") return "cancelled";

  const streamSaverAttempt = await streamEntryWithStreamSaver(entry);
  if (streamSaverAttempt === "success") {
    logDebug("Downloading via StreamSaver stream.");
    return "streamsaver";
  }
  if (streamSaverAttempt === "cancelled") return "cancelled";

  logDebug("Downloading via blob URL fallback.");
  await downloadEntryAsBlob(entry);
};
