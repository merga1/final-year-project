export type NavItem = {
  href: string;
  label: string;
  iconName: 'home' | 'add-tech' | 'support' | 'add-customer' | 'customer' | 'tech' | 'profile' | 'billing';
};

export const navItems: NavItem[] = [
  { href: '/', label: 'HOME', iconName: 'home' },
  { href: '/technicians/new', label: 'ADD TECHNICIAN', iconName: 'add-tech' },
  { href: '/support-tickets', label: 'SUPPORT TICKET', iconName: 'support' },
  { href: '/customers/new', label: 'ADD CUSTOMER', iconName: 'add-customer' },
  { href: '/customers', label: 'CUSTOMER', iconName: 'customer' },
  { href: '/technicians', label: 'TECHNICIAN', iconName: 'tech' },
  { href: '/profile', label: 'PROFILE', iconName: 'profile' },
  { href: '/billing', label: 'Billing', iconName: 'billing' },
];
