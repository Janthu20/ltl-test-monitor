
export interface TankConfig {
  diameter: number;
  max_height: number;
  p1_raw: number;
  p1_h: number;
  p2_raw: number;
  p2_h: number;
  p3_raw: number;
  p3_h: number;
  isConfigured: boolean;
}

export interface TankData {
  analog_raw: number;
  config?: TankConfig;
}

export interface AppState {
  tanks: Record<string, TankData>;
  totalVolume: number;
  avgLevel: number;
  loading: boolean;
  isAdmin: boolean;
  user: any | null;
}

export enum View {
  DASHBOARD = 'DASHBOARD',
  CALIBRATION_AUTH = 'CALIBRATION_AUTH',
  CHANGE_PIN = 'CHANGE_PIN',
  TANK_SELECTION = 'TANK_SELECTION',
  WIZARD = 'WIZARD',
  LOGIN = 'LOGIN',
  USER_MANAGEMENT = 'USER_MANAGEMENT',
  SETTINGS = 'SETTINGS'
}
