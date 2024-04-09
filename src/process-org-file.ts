import { visitIds } from "orgast-util-visit-ids";
import { unified } from "unified";
import { OrgNode } from "uniorg";
import extractKeywords from "uniorg-extract-keywords";
import orgParse from "uniorg-parse";
import org2rehype from "uniorg-rehype";
import { uniorgSlug } from "uniorg-slug";
import { VFile } from "vfile";
import { parseTimestamp, toJson } from "./utils.js";

const processor = unified()
  .use(orgParse)
  .use(extractKeywords)
  .use(cleanMetadata)
  .use(uniorgSlug)
  .use(extractIds)
  .use(org2rehype)
  .use(toJson);

export default async function processOrgFile(file: VFile) {
  try {
    return await processor.process(file);
  } catch (e) {
    console.error("failed to process file", file.path, e);
    throw e;
  }
}

function cleanMetadata() {
  return function (_tree: OrgNode, file: VFile) {
    const data = file.data || (file.data = {});

    const date = data.date;
    if (date != null) {
      data.date = parseTimestamp(date);
    }

    const fileTags = data.filetags as string;

    if (fileTags != null) {
      data.tags = data.tags || [];
      data.tags.push(...fileTags.split(":").filter((x) => x.length > 0));
    }
  };
}

function extractIds() {
  return function (tree: OrgNode, file: VFile) {
    const data = file.data || (file.data = {});
    const ids: Record<string, string> = data.ids || (data.ids = {});

    visitIds(tree, (id, node) => {
      if (node.type === "org-data") {
        ids[id] = "";
      } else if (node.type === "section") {
        const headline = node.children[0];
        if (!headline.data?.hProperties?.id) {
          // The headline doesn't have an html id assigned. (Did you
          // remove uniorg-slug?)
          //
          // Assign an html id property based on org id property.
          headline.data = headline.data || {};
          headline.data.hProperties = headline.data.hProperties || {};
          headline.data.hProperties.id = id;
        }

        ids[id] = "#" + headline.data.hProperties.id;
      }
    });
  };
}
