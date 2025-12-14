'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, DollarSign, Wallet, CreditCard, Home, Users } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthSession } from '@/hooks/use-auth-session';
import { isAdmin } from '@/lib/auth-helpers';

const adminMenuItems = [
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/rates', label: 'Service Rates', icon: DollarSign },
  { href: '/admin/salary', label: 'Employee Salary', icon: Wallet },
  { href: '/admin/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/?view=customer', label: 'Customer View', icon: Home },
];

export function AdminMenu() {
  const pathname = usePathname();
  const { user, loading } = useAuthSession();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function checkAdminRole() {
      if (loading) return;
      if (!user) {
        setUserIsAdmin(false);
        setCheckingRole(false);
        return;
      }
      const adminStatus = await isAdmin(user.id);
      setUserIsAdmin(adminStatus);
      setCheckingRole(false);
    }
    checkAdminRole();
  }, [user, loading]);

  if (checkingRole || !userIsAdmin) {
    return null;
  }

  return (
    <nav className="w-full border-b bg-background/95 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide">
          {adminMenuItems.map((item) => {
            const Icon = item.icon;
            // Extract pathname from href (remove query params for comparison)
            const itemPath = item.href.split('?')[0];
            const isActive = pathname === itemPath || (itemPath !== '/' && pathname.startsWith(itemPath + '/'));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap',
                  'hover:bg-accent hover:text-accent-foreground',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

