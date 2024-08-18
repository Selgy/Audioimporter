import { CEP_Config } from "vite-cep-plugin";
import { version } from "./package.json";


const config: CEP_Config = {
  version,
  id: "com.AudioImporterV2.cep",
  displayName: "Audio Importer V2",
  symlink: "local",
  port: 3000,
  servePort: 5000,
  startingDebugPort: 8850,
  extensionManifestVersion: 6.0,
  requiredRuntimeVersion: 9.0,
  hosts: [
    { name: "PPRO", version: "[0.0,99.9]" }
  ],
  type: "Panel",
  iconDarkNormal: "./src/assets/light-icon.png",
  iconNormal: "./src/assets/dark-icon.png",
  iconDarkNormalRollOver: "./src/assets/light-icon.png",
  iconNormalRollOver: "./src/assets/dark-icon.png",
  parameters: ["--v=0", "--enable-nodejs", "--mixed-context"],
  width: 500,
  height: 550,

  panels: [
    {
      mainPath: "./main/index.html",
      name: "main",
      panelDisplayName: "Audio Importer V2",
      autoVisible: true,
      width: 690,
      height: 650,
    },
    {
      mainPath: "./settings/index.html", 
      name: "settings", 
      autoVisible: false, 
      type: "Custom", 
      startOnEvents: ["com.adobe.csxs.events.ApplicationInitialized", "applicationActive"], 
      height: 1, 
    }
  ],
  build: {
    jsxBin: "off",
    sourceMap: true,
  },
  zxp: {
    country: "US",
    province: "CA",
    org: "MyCompany",
    password: "mypassword",
    tsa: "http://timestamp.digicert.com/",
    sourceMap: false,
    jsxBin: "off",
  },
  installModules: [],
  copyAssets: [
    "./target/release/audio_importer.exe", 
  ],

  copyZipAssets: [],
};
export default config;
