import { Plugin } from "unified";
import { Node } from "unist";

declare module "unified" {
  interface CompileResultMap {
    // Register a new result (value is used, key should match it).
    Node: Node;
  }
}

declare module "vfile" {
  interface DataMap {
    links: Set<string>;
    backlinks: Map<string, { slug: string; title: string }>;
    images: { to: string; from: string }[];
    slug: string;
    title: string;
    date: string;
    tags: string[];
    ids: Record<string, string>;
  }
}

/** A primitive compiler to return node as is without stringifying. */
export const fromJson: Plugin = function () {
  this.parser = (node, file) => {
    return file.result || JSON.parse(node);
  };
};

/** A primitive compiler to return node as is without stringifying. */
export const toJson: Plugin = function () {
  this.compiler = (node) => {
    return node;
  };
};

export const parseTimestamp = (r: string) => {
  const timeRegexp = /[\[<](\d{4})-(\d{2})-(\d{2}).*[\]>]/;

  const m = r.match(timeRegexp);
  if (m != null) {
    const year = m[1];
    const month = m[2];
    const day = m[3];
    return `${year}-${month}-${day}`;
  }
  return r;
};
