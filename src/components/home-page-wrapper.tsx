'use client';

import React from 'react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { usePathname } from 'next/navigation';

interface GridItem {
  href: string;
  label: string;
  icon: React.ElementType;
  comingSoon?: boolean;
}

interface HomePageWrapperProps {
  children: React.ReactNode;
  gridItems: GridItem[];
}

export function HomePageWrapper({ children, gridItems }: HomePageWrapperProps) {
  const pathname = usePathname();
  const ongoingOrdersCount = 0;
  const isAdmin = pathname.startsWith('/admin');

  const mainContent = React.Children.map(children, (child) => {
    if (!React.isValidElement(child)) return child;
    
    const replaceGrid = (node: React.ReactNode): React.ReactNode => {
      if (!React.isValidElement(node)) return node;

      const className = node.props.className || '';
      if (typeof className === 'string' && className.includes('grid')) {
         return (
            <div key="grid-wrapper" className={`grid gap-x-2 gap-y-2 sm:gap-x-4 sm:gap-y-4 w-full max-w-[280px] sm:max-w-[320px] pb-4 ${isAdmin ? 'grid-cols-3' : 'grid-cols-3'}`}>
              {gridItems.map((item) => {
                const isComingSoon = item.comingSoon;
                const isOrderStatus = item.label === 'Order Status';
                const Wrapper = isComingSoon ? 'div' : Link;
                const props = isComingSoon ? {} : { href: item.href };

                return (
                  <Wrapper
                    key={item.label}
                    {...props}
                    className={cn("relative flex flex-col items-center justify-center gap-1 p-1 rounded-lg group", isComingSoon ? 'opacity-50 cursor-not-allowed' : '')}
                  >
                    {isOrderStatus && ongoingOrdersCount > 0 && !isAdmin && (
                      <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center z-10">
                        {ongoingOrdersCount}
                      </div>
                    )}
                    {isComingSoon && (
                        <Badge variant="secondary" className="absolute top-0 -mt-2 text-xs z-10">
                            Soon
                        </Badge>
                    )}
                    <item.icon className="h-12 w-12 md:h-14 md:w-14 text-foreground/80 group-hover:text-primary transition-colors" />
                    <span className="text-xs sm:text-sm font-medium text-foreground/90 text-center">{item.label}</span>
                  </Wrapper>
                );
              })}
            </div>
        );
      }

      if (node.props.children) {
        const newChildren = React.Children.map(node.props.children, replaceGrid);
        return React.cloneElement(node, { children: newChildren });
      }

      return node;
    };

    return replaceGrid(child);
  });

  return <>{mainContent}</>;
}
