
'use client';

import React from 'react';
import Link from 'next/link';
import { useOrders } from '@/context/OrderContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
  const { orders } = useOrders();

  const ongoingOrdersCount = orders.filter(
    (order) => order.status !== 'Delivered' && order.status !== 'Success'
  ).length;

  const mainContent = React.Children.map(children, (child, childIndex) => {
    if (React.isValidElement(child)) {
      // Find the grid container and replace its children with the dynamic grid
      const grandChildren = (child.props.children as React.ReactNode[]).map((grandchild, grandchildIndex) => {
        if (React.isValidElement(grandchild) && grandchild.props.className?.includes('overflow-y-auto')) {
            const mainChildren = (grandchild.props.children as React.ReactNode[]).map((mainChild, mainChildIndex) => {
                if (React.isValidElement(mainChild) && mainChild.props.className?.includes('grid-cols-3')) {
                    return (
                        <div key="grid-wrapper" className="grid grid-cols-3 gap-x-2 gap-y-2 sm:gap-x-4 sm:gap-y-4 w-full max-w-sm sm:max-w-md pb-4">
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
                                {isOrderStatus && ongoingOrdersCount > 0 && (
                                  <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center z-10">
                                    {ongoingOrdersCount}
                                  </div>
                                )}
                                {isComingSoon && (
                                    <Badge variant="secondary" className="absolute top-0 -mt-2 text-xs z-10">
                                        Soon
                                    </Badge>
                                )}
                                <item.icon className="h-14 w-14 md:h-16 md:w-16 text-foreground/80 group-hover:text-primary transition-colors" />
                                <span className="text-sm sm:text-base font-medium text-foreground/90 text-center">{item.label}</span>
                              </Wrapper>
                            );
                          })}
                        </div>
                    );
                }
                return React.cloneElement(mainChild, { key: `mainChild-${mainChildIndex}` });
            })
             return React.cloneElement(grandchild, { key: `grandchild-${grandchildIndex}`, children: mainChildren });
        }
        return React.cloneElement(grandchild, { key: `grandchild-${grandchildIndex}` });
      })
      return React.cloneElement(child, { key: `child-${childIndex}`, children: grandChildren });
    }
    return child;
  });

  return <>{mainContent}</>;
}
