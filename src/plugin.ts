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
          let fromPath = image.from;
          if (fromPath.startsWith("~")) {
            fromPath = fromPath.replace("~", os.homedir());
          }
          const from = fromPath;
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

  config.addWatchTarget(options.orgDir);

  config.addCollection(options.collectionName, function () {
    return data;
  });
}
