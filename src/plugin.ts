import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadPosts } from "./api.js";

interface RequiredOptions {
  orgDir: string;
  blogTag?: string | string[];
  excludeTags?: string[];
}
const defaultOptions = {
  collectionName: "org",
  imageFolder: "org-images",
  noexportCheck: true,
};

type PluginOptions = Partial<typeof defaultOptions> & RequiredOptions;

export default async function (config: any, overrideOptions: PluginOptions) {
  const options = { ...defaultOptions, ...overrideOptions };

  const excludeTags = [...(options.excludeTags ?? [])];
  if (options.noexportCheck) {
    excludeTags.push("noexport");
  }

  const blogTags: string[] = [];
  if (typeof options.blogTag === "string") {
    blogTags.push(options.blogTag);
  } else {
    blogTags.push(...(options.blogTag ?? []));
  }

  const data = await loadPosts(options.orgDir, blogTags, excludeTags);

  data.forEach((file) => {
    const images = file.data.images;
    if (images) {
      for (const image of images) {
        try {
          let from = image.from;
          if (from.startsWith("~")) {
            from = from.replace("~", os.homedir());
          } else {
            from = path.join(options.orgDir, from);
          }
          const to = path.join(config.dir.output, image.to);
          if (!fs.existsSync(path.dirname(to))) {
            fs.mkdirSync(path.dirname(to), { recursive: true });
          }
          fs.copyFileSync(from, to);
        } catch (e) {
          console.log(e);
        }
      }
    }
  });

  config.addCollection(`${options.collectionName}Tags`, function () {
    const tags = new Set(data.flatMap((file) => file.tags ?? []));
    for (const tag of blogTags) {
      tags.delete(tag);
    }

    return [...tags].map((tag) => {
      const posts = data.filter((post) => post.tags?.includes(tag));
      return { tagName: tag, posts };
    });
  });

  config.addCollection(options.collectionName, function () {
    return data;
  });

  config.addWatchTarget(options.orgDir);
}
