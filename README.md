# Eleventy org-mode plugin
[![typescript-image]][typescript-url] [![npm-image]][npm-url] [![license-image]][license-url]

This plugin lets you pull your org notes into eleventy data for further processing.

## Highlights
- handles org id links and translates them to relative file links
- calculates backlinks for notes
- handles images linked in notes
- extracts tags assigned in org mode
- compatible with org-roam

## Setup
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
- `blogTag` - (default: null) optionally can filter notes to those having specific org tags, can be a string or array of strings
- `excludeTags` - (default: null) an array of tags - notes with that tags will be filtered out of the final collection
- `noexportCheck` - (default: true) whether to automatically filter out notes with nooexport tag (default org-mode tag for (wait for it) disabling export)
- `collectionName` - (default: "org") name of the eleventy collection that org files will be assigned to
- `imageFolder` - (default: "org-images") name of the folder to copy images from org notes

## Usage
After setting everything up plugin will create a new eleventy collection with data representing your org notes. By default this collection is named `org`.

The data structure for each note is following:
```ts
interface Note {
  title: string; // Note title
  slug: string; // Note slug derived from file name
  content: string; // Html content of the note
  tags: string[]; // File tags
  date: string // Eleventy compatible date in format 'YYYY-MM-DD'
  data: {
    links: Set<string>; // Set of links coming from that page
    backlinks: Map<string, { slug: string, title: string } // Map of backlinks for given note
    // all of the keywords parsed from org file header
  }
}
```

You can generate files from the data by using eleventy paging feature eg.:
```
---
pagination:
    data: collections.org
    size: 1
    alias: post
	addAllPagesToCollections: true
permalink: "{{ post.data.slug }}/"
---
<!DOCTYPE html>
<html>
  <body>
  ...
    <h1>{{ post.title }}</h1>

    {{ post.content | raw }}
  ...
  </body>
</html>
```
Unfortunately at this point in time eleventy does not support setting tags while dynamically creating the pages, so you can't use `collection.tagName` to get the org mode pages tagged with `tagName`. Because of that there is a second collection created by suffixing base collection with `Tags` (so `orgTags` by default). Each element in tags collection nas `tagName` and `posts` fields.

Using this collection you can create tag pages eg.
```
---
pagination:
  data: collections.orgTags
  size: 1
  alias: tag
permalink: /tags/{{ tag.tagName }}/
eleventyComputed:
  title: Tagged {{ tag.tagName }}
---
...
{% for post in tag.posts %}
<li><a href="{{post.data.slug}}">{{ post.data.title }}</a></li>
{% endfor %}
...
```

You can find more complete example in [example folder](./example/)

## Inspiration
Thanks to [uniorg](https://github.com/rasendubi/uniorg) library for providing a great way to parse and work with org-mode files. Base of this plugin has been extracted from one of the examples supplied by uniorg

[typescript-image]: https://img.shields.io/badge/Typescript-294E80.svg?style=for-the-badge&logo=typescript
[typescript-url]: "typescript"

[license-image]: https://img.shields.io/npm/l/eleventy-plugin-org-?color=blueviolet&style=for-the-badge
[license-url]: LICENSE 'license'

[npm-image]: https://img.shields.io/npm/v/eleventy-plugin-org.svg?style=for-the-badge&logo=npm
[npm-url]: https://npmjs.org/package/eleventy-plugin-org 'npm'
