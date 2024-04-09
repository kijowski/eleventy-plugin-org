import { randomUUID } from "node:crypto";
import * as path from "node:path";
import stringify from "rehype-stringify";
import inspectUrls, { UrlMatch } from "rehype-url-inspector";
import { read } from "to-vfile";
import { trough } from "trough";
import { unified } from "unified";
import { Data, VFile } from "vfile";
import { findDownAll } from "vfile-find-down";
import report from "vfile-reporter";
import processOrgFile from "./process-org-file.js";
import { fromJson, toJson } from "./utils.js";

async function collectFiles(root: string) {
  const files = await findDownAll(".org", root);
  files.forEach((f) => {
    const slug = "/" + path.relative(root, f.path).replace(/\.org$/, "");
    f.data.slug = slug;
  });
  return files;
}

async function processPosts(files: VFile[]) {
  return Promise.all(
    files.map(async (file) => {
      try {
        await read(file, "utf8");
      } catch (e) {
        console.error("Error reading file", file, e);
        throw e;
      }

      return processOrgFile(file);
    })
  );
}

function filterPosts(searchTag?: string) {
  return function (files: VFile[]) {
    if (searchTag == null || searchTag === "") {
      return files;
    }
    return files.filter((file) =>
      file.data.tags?.find((tag) => tag === searchTag)
    );
  };
}

function processLinks(files: VFile[]) {
  // map from id -> { path, url }
  const idMap: Record<string, { path: string; anchor: string }> = {};

  files.forEach((file) => {
    Object.entries(file.data.ids!).forEach(([id, anchor]) => {
      idMap[id] = { path: file.path, anchor };
    });
  });

  const processor = unified()
    .use(fromJson)
    .use(inspectUrls as any, { inspectEach: processUrl })
    .use(toJson);

  return Promise.all(files.map((file) => processor.process(file)));

  /**
   * Process each link to:
   * 1. Resolve id links.
   * 2. Convert relative file:// links to path used by
   *    blog. file://file.org -> /file.org
   * 3. Collect all links to file.data.links, so they can be used later
   *    to calculate backlinks.
   */
  function processUrl({ url: urlString, propertyName, node, file }: UrlMatch) {
    try {
      let url = new URL(urlString, "file://" + file.path);

      const data = file.data as Data;

      // process id links
      if (url.protocol === "id:") {
        const id = url.pathname;
        const ref = idMap[id];
        if (ref) {
          url = new URL(`file://${ref.path}${ref.anchor}`);
        } else {
          console.warn(`${file.path}: Unresolved id link`, urlString);
        }
        // fallthrough. id links are re-processed as file links
      }

      if (url.protocol === "file:") {
        let href = url.pathname.replace(/\.org$/, "");
        node.properties![propertyName!] = href + url.hash;

        data.links = data.links || new Set();
        data.links.add(href);
      }

      if (node.tagName === "img" && url.protocol === "file:") {
        const to = "/images/" + randomUUID() + path.extname(url.pathname);
        node.properties![propertyName!] = to;

        let from = decodeURIComponent(url.pathname);

        if (urlString.startsWith("file:~")) {
          from = urlString.replace("file:", "");
        }

        data.images = data.images || [];
        data.images.push({
          to,
          from,
        });
      }
    } catch (e) {
      // This can happen if org file contains an invalid string, that
      // looks like URL string (e.g., "http://example.com:blah/"
      // passes regexes, but fails to parse as URL).
      console.warn(`${file.path}: Failed to process URL`, urlString, e);
      // No re-throwing: the issue is not critical enough to stop
      // processing. The document is still valid, it's just link that
      // isn't.
    }
  }
}

function populateBacklinks(files: VFile[]) {
  const backlinks: Record<
    string,
    Map<string, { slug: string; title: string }>
  > = {};

  files.forEach((file) => {
    const data = file.data;

    data.links = file.data.links || new Set();
    data.backlinks = backlinks[data.slug!] = backlinks[data.slug!] || new Map();

    data.links.forEach((other) => {
      const decodedOther = decodeURIComponent(other);
      backlinks[decodedOther] = backlinks[decodedOther] || new Map();
      backlinks[decodedOther].set(data.slug!, {
        slug: data.slug!,
        title: data.title!,
      });
    });
  });
}

async function convertPosts(files: VFile[]) {
  const processor = unified().use(fromJson).use(stringify);
  return Promise.all(
    files.map(async (file) => {
      try {
        await processor.process(file);
      } catch (err) {
        console.log(err);
      }

      return file;
    })
  );
}

export const loadPosts = async (pagesDirectory: string, searchTag?: string) => {
  const processor = trough()
    .use(collectFiles)
    .use(processPosts)
    .use(filterPosts(searchTag))
    .use(processLinks)
    .use(convertPosts)
    .use(populateBacklinks);

  const files = await new Promise<VFile[]>((resolve, reject) =>
    processor.run(pagesDirectory, (err: any, files: VFile[]) => {
      console.error(report(err || files, { quiet: true }));
      if (err) reject(err);
      else resolve(files);
    })
  );
  return files
    .map((file) => ({
      ...file,
      date: file.data.date,
      tags: file.data.tags,
      content: file.value,
      // page: { date: file.data.date },
    }))
    .toSorted((a, b) => b.date?.localeCompare(a.date ?? "") ?? 0);
};
