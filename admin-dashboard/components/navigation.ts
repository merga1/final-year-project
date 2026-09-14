export type NavItem = {
  href: string;
  label: string;
  icon: string;
};

export const navItems: NavItem[] = [
  { href: '/', label: 'Overview', icon: '🏠' },
  { href: '/customers', label: 'Customers', icon: '👥' },
  { href: '/devices', label: 'Devices', icon: '📡' },
  { href: '/usage-analytics', label: 'Usage Analytics', icon: '📊' },
  { href: '/billing', label: 'Billing', icon: '🧾' },
  { href: '/payments', label: 'Payments', icon: '💳' },
  { href: '/alerts', label: 'Alerts', icon: '🔔' },
  { href: '/support-tickets', label: 'Support Tickets', icon: '🎫' },
  { href: '/technicians', label: 'Technicians', icon: '🔧' },
];
