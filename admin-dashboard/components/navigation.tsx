// components/navigation.tsx
export type NavItem = {
  href: string;
  label: string;
  iconName: string;
};

export const navItems: NavItem[] = [
  { href: '/',                  label: 'Overview',         iconName: 'home' },
  { href: '/customers',         label: 'Customers',        iconName: 'customers' },
  { href: '/technicians',       label: 'Technicians',      iconName: 'technicians' },
  { href: '/devices',           label: 'Devices',          iconName: 'devices' },
  { href: '/usage-analytics',   label: 'Usage & Readings', iconName: 'usage' },
  { href: '/alerts',            label: 'Alerts',           iconName: 'alerts' },
  { href: '/support-tickets',   label: 'Support Tickets',  iconName: 'tickets' },
  { href: '/billing',           label: 'Billing',          iconName: 'billing' },
  { href: '/payments',          label: 'Payments',         iconName: 'payments' },
  { href: '/audit',             label: 'Audit Log',        iconName: 'audit' },
  { href: '/profile',           label: 'Profile',          iconName: 'profile' },
];
