import plugin from "eleventy-plugin-org";

export default function (config) {
  config.addPlugin(plugin, { orgDir: "/path/to/your/org" });
}
