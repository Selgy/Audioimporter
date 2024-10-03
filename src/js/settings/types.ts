export interface AudioBinding {
  volume: number;
  pitch: number;
  track: string;
  path: string;
  importInMiddle: boolean;
}

export interface ProfileConfig {
  [key: string]: AudioBinding;
}

export interface Config {
  currentProfile: string;
  lastSelectedProfile: string;
  profiles: {
    [profileName: string]: ProfileConfig;
  };
}