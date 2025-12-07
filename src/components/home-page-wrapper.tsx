
'use client';

import React from 'react';
import Link from 'next/link';
import { useOrders } from '@/context/OrderContext';

interface GridItem {
  href: string;
  label: string;
  icon: React.ElementType;
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
                          {gridItems.map((item) => (
                            <Link href={item.href} key={item.label} className="relative flex flex-col items-center justify-center gap-1 p-1 rounded-lg group">
                              {item.label === 'Order Status' && ongoingOrdersCount > 0 && (
                                <div className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                                  {ongoingOrdersCount}
                                </div>
                              )}
                              <item.icon className="h-14 w-14 md:h-16 md:w-16 text-foreground/80 group-hover:text-primary transition-colors" />
                              <span className="text-sm sm:text-base font-medium text-foreground/90 text-center">{item.label}</span>
                            </Link>
                          ))}
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
