import { SettingSchemaDesc } from "@logseq/libs/dist/LSPlugin";

const settings: SettingSchemaDesc[] = [
  {
    key: "serverUrl",
    type: "string",
    title: "Server URL",
    description: "The URL of the server to sync with.",
    default: "http://localhost:3000",
  },
];

export default settings;
