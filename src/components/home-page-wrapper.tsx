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
            <div key="grid-wrapper" className={cn("grid w-full max-w-md", className)}>
              {gridItems.map((item) => {
                const isComingSoon = item.comingSoon;
                const isOrderStatus = item.label === 'Order Status';
                const Wrapper = isComingSoon ? 'div' : Link;
                const props = isComingSoon ? {} : { href: item.href };

                return (
                  <Wrapper
                    key={item.label}
                    {...props}
                    className={cn(
                      "relative flex flex-col items-center justify-start gap-1 p-2 rounded-lg group h-24",
                      isComingSoon ? 'opacity-50 cursor-not-allowed' : 'hover:bg-muted'
                    )}
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
                    <div className="flex-shrink-0">
                      <item.icon className="h-10 w-10 md:h-12 md:w-12 text-foreground/80 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground/90 text-center flex-grow flex items-center">{item.label}</span>
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
