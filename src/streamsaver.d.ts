declare module "streamsaver" {
  const streamSaver: {
    supported?: boolean;
    mitm?: string;
    createWriteStream: (filename: string, options?: { size?: number }) => WritableStream;
  };

  export default streamSaver;
}
