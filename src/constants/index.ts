import { LocationOption } from '@/types';

export const LOCATION_OPTIONS: LocationOption[] = [
  {
    id: 'hambawang_timur',
    name: 'Gudang BULOG Pantai Hambawang Timur',
    latlng: '-2.6411002644013295,115.33504681162752',
    address: 'Gudang BULOG Pantai Hambawang Timur\nKabupaten Hulu Sungai Tengah\nKalimantan Selatan',
  },
  {
    id: 'andang',
    name: 'Gudang BULOG Andang',
    latlng: '-2.6810775314690543,115.32615174419966',
    address: 'Gudang BULOG Andang\nKabupaten Hulu Sungai Tengah\nKalimantan Selatan',
  },
];

export const API_ROUTES = {
  PROXY_AUTH: '/api/auth',
  PROXY_DASHBOARD: '/api/dashboard',
  PROXY_VERIFY_FACE: '/api/verify-face',
  PROXY_CHECKIN: '/api/checkin',
};
