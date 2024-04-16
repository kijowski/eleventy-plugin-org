import * as fs from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { loadPosts } from "./api.js";

interface RequiredOptions {
  orgDir: string;
  blogTag?: string;
}
const defaultOptions = {
  collectionName: "org",
  imageFolder: "org-images",
};

type PluginOptions = Partial<typeof defaultOptions> & RequiredOptions;

export default async function (config: any, overrideOptions: PluginOptions) {
  const options = { ...defaultOptions, ...overrideOptions };

  const data = await loadPosts(options.orgDir, options.blogTag);

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
    if (options.blogTag) {
      tags.delete(options.blogTag);
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
