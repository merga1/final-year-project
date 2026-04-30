export type NavItem = {
  href: string;
  label: string;
};

export const navItems: NavItem[] = [
  { href: '/', label: 'Overview' },
  { href: '/customers', label: 'Customers' },
  { href: '/devices', label: 'Devices' },
  { href: '/usage-analytics', label: 'Usage Analytics' },
  { href: '/billing', label: 'Billing' },
  { href: '/payments', label: 'Payments' },
  { href: '/alerts', label: 'Alerts' },
  { href: '/support-tickets', label: 'Support Tickets' },
  { href: '/technicians', label: 'Technicians' },
];
