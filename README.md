# Eleventy org-mode plugin
[![typescript-image]][typescript-url] [![npm-image]][npm-url] [![license-image]][license-url]

This plugin lets you pull your org notes into eleventy data for further processing.

## Highlights
- handles org id links and translates them to relative file links
- calculates backlinks for notes
- handles images linked in notes
- compatible with org-roam

## Usage
Install the plugin:
```bash
npm install eleventy-plugin-org

```
Add it to your eleventy config. There is one required configuration option: `orgDir` which should point to folder with your org files.
```javascript
const pluginOrg = require("eleventy-plugin-org");

module.exports = function (eleventyConfig) {
  eleventyConfig.addPlugin(pluginOrg, { orgDir: "~/org-notes/" });
};
```

## Configuration options
- `orgDir` - folder with org files
- `blogTag` - (default: null) optionally can filter notes to those having specific org tag
- `collectionName` - (default: "org") name of the eleventy collection that org files will be assigned to
- `imageFolder` - (default: "org-images") name of the folder to copy images from org notes

## Inspiration
Thanks to [uniorg](https://github.com/rasendubi/uniorg) library for providing a great way to parse and work with org-mode files. Base of this plugin has been extracted from one of the examples supplied by uniorg

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: "typescript"

[license-image]: https://img.shields.io/npm/l/eleventy-plugin-org-?color=blueviolet&style=for-the-badge
[license-url]: LICENSE 'license'

[npm-image]: https://img.shields.io/npm/v/eleventy-plugin-org.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/eleventy-plugin-org 'npm'
