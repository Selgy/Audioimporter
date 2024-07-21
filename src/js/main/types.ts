export interface AudioBinding {
  volume: number;
  pitch: number;
  track: string;
  path: string;
}

export interface Config {
  [key: string]: AudioBinding;
}
