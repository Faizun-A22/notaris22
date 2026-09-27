import { ROLES } from './roles';

export const MENU_ITEMS = {
  [ROLES.OWNER]: [
    {
      label: 'Dashboard',
      path: '/owner/dashboard',
      icon: 'dashboard',
      fill: 1
    },
    {
      label: 'Staff',
      path: '/owner/staff',
      icon: 'badge',
      fill: 0
    },
    {
      label: 'Documents',
      path: '/owner/documents',
      icon: 'description',
      fill: 0
    },
    {
      label: 'Clients',
      path: '/owner/clients',
      icon: 'group',
      fill: 0
    }
  ],
  [ROLES.STAFF]: [
    {
      label: 'Dashboard',
      path: '/staff/dashboard',
      icon: 'dashboard',
      fill: 1
    },
    {
      label: 'Manajemen Berkas',
      path: '/staff/documents',
      icon: 'description', // fall back to standard description or matching icon
      fill: 0
    },
    {
      label: 'Log Aktivitas',
      path: '/staff/activity',
      icon: 'history',
      fill: 0
    },
    {
      label: 'Pengaturan',
      path: '/staff/settings',
      icon: 'settings',
      fill: 0
    }
  ]
};
