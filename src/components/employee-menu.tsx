'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardList, Wallet } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthSession } from '@/hooks/use-auth-session';
import { isEmployee } from '@/lib/auth-helpers';

const employeeMenuItems = [
  { href: '/employee', label: 'Orders', icon: ClipboardList },
  { href: '/employee/salary', label: 'Salary', icon: Wallet },
];

export function EmployeeMenu() {
  const pathname = usePathname();
  const { user, loading } = useAuthSession();
  const [userIsEmployee, setUserIsEmployee] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    async function checkEmployeeRole() {
      if (loading) return;
      if (!user) {
        setUserIsEmployee(false);
        setCheckingRole(false);
        return;
      }
      const employeeStatus = await isEmployee(user.id);
      setUserIsEmployee(employeeStatus);
      setCheckingRole(false);
    }
    checkEmployeeRole();
  }, [user, loading]);

  if (checkingRole || !userIsEmployee) {
    return null;
  }

  // Center menu if only one item
  const isSingleItem = employeeMenuItems.length === 1;

  return (
    <nav className="w-full border-b bg-background/95 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className={cn(
          "flex items-center gap-1 overflow-x-auto scrollbar-hide",
          isSingleItem && "justify-center"
        )}>
          {employeeMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
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

