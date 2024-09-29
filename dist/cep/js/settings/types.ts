export interface AudioBinding {
  volume: number;
  pitch: number;
  track: string;
  path: string;
  importInMiddle: boolean;
}

export interface Config {
  [key: string]: AudioBinding;
}
