import { HostSettings } from '../../../../shared/types/src/HostSettings';

let hostSettings: HostSettings | null = null;

export const getHostSettings = (): HostSettings | null => hostSettings;
export const saveHostSettings = (settings: HostSettings): void => {
  hostSettings = settings;
};
export const clearHostSettings = (): void => {
  hostSettings = null;
};