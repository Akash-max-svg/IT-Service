export interface VantaSettings {
  color: string;
  backgroundColor: string;
  backgroundAlpha: number;
  points: number;
  maxDistance: number;
  spacing: number;
  showDots: boolean;
  enableBgImage: boolean;
  bgImageUrl: string;
  bgImageOpacity: number;
}

export const DEFAULT_VANTA_SETTINGS: VantaSettings = {
  color: '#3fe8d4',
  backgroundColor: '#080b11',
  backgroundAlpha: 0.35,
  points: 12,
  maxDistance: 22,
  spacing: 16,
  showDots: true,
  enableBgImage: true,
  bgImageUrl: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1920&q=80',
  bgImageOpacity: 0.3,
};
