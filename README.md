# zip-viewer

A simple web app to display the contents of a remote ZIP file. Maximum allowed file size is 200 MB.

Uses [zip.js](https://gildas-lormeau.github.io/zip.js) to read the file's directory metadata.

## How to use

When the app is running, submit a valid remote ZIP file URL via query parameter `url`. For example:

```
/?url=https://data.source.coop/harvard-lil/gov-data/collections/data_gov/baffin-bay-region-narwhal-research-version-1/v1.zip
```

Once the remote file loads, use the interface to navigate its compressed contents.

## Development setup

```sh
# Install dependencies
npm install

# Run development server
npm run dev

# Build production website
npm run build
```
