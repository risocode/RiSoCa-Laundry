'use client';

import {
  Package,
  DollarSign,
  CheckCircle2,
  Wallet,
  Layers,
} from 'lucide-react';
import type { OrderStatistics } from './calculate-statistics';
import { formatCurrencyWhole } from '@/lib/utils';

interface StatisticsCardsProps {
  statistics: OrderStatistics;
}

export function StatisticsCards({ statistics }: StatisticsCardsProps) {
  const cardBaseClasses = [
    'p-4 rounded-[20px] bg-gray-200 dark:bg-gray-800',
    '[box-shadow:inset_-10px_-10px_20px_rgba(255,255,255,0.5),',
    'inset_10px_10px_20px_rgba(153,161,175,0.3),',
    '-10px_-10px_20px_rgba(255,255,255,0.5),',
    '10px_10px_20px_rgba(153,161,175,0.3)]',
    'dark:[box-shadow:inset_-10px_-10px_20px_rgba(255,255,255,0.05),',
    'inset_10px_10px_20px_rgba(0,0,0,0.3),',
    '-10px_-10px_20px_rgba(255,255,255,0.05),',
    '10px_10px_20px_rgba(0,0,0,0.3)]',
    'flex flex-col',
  ].join(' ');

  const iconBaseClasses = [
    'relative p-2 rounded-full',
    '[box-shadow:-2px_-2px_4px_rgba(255,255,255,0.5),',
    '2px_2px_4px_rgba(153,161,175,0.3)]',
  ].join(' ');

  const titleClasses = [
    'text-[13px] font-medium text-[#64748B]',
    'dark:text-[#64748B] tracking-[0.2px] flex-1',
  ].join(' ');

  const valueClasses = [
    'text-[30px] font-bold leading-[1.1] mb-2',
  ].join(' ');

  const subtextClasses = [
    'text-[12px] font-normal text-[#94A3B8]',
    'dark:text-[#94A3B8] opacity-80 mt-1.5',
  ].join(' ');

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 items-stretch">
      {/* Total Orders Card */}
      <div className={cardBaseClasses}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`${iconBaseClasses} bg-emerald-500/85`}>
            <Package className="h-3.5 w-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className={titleClasses}>Total Orders</p>
        </div>
        <div className="flex flex-col justify-end flex-1">
          <p className={`${valueClasses} text-[#334155] dark:text-[#F1F5F9]`}>
            {statistics.totalOrders}
          </p>
          <p className={subtextClasses}>
            {statistics.todayOrders} today
          </p>
        </div>
      </div>

      {/* Paid Revenue Card */}
      <div className={cardBaseClasses}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`${iconBaseClasses} bg-[#16A34A]/85`}>
            <CheckCircle2 className="h-3.5 w-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className={titleClasses}>Paid Revenue</p>
        </div>
        <div className="flex flex-col justify-end flex-1">
          <p className={`${valueClasses} text-[#16A34A] dark:text-[#16A34A]`}>
            <span className="text-[#16A34A] dark:text-[#16A34A] opacity-85 text-[28px]">
              ₱
            </span>
            {formatCurrencyWhole(statistics.paidRevenue)}
          </p>
          <p className="text-[12px] font-normal text-[#16A34A]/60 dark:text-[#16A34A]/60 opacity-80 mt-1.5">
            Today: ₱{formatCurrencyWhole(statistics.todayRevenue)}
          </p>
        </div>
      </div>

      {/* Pending Revenue Card */}
      <div className={cardBaseClasses}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`${iconBaseClasses} bg-[#F97316]/85`}>
            <Wallet className="h-3.5 w-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className={titleClasses}>Pending Revenue</p>
        </div>
        <div className="flex flex-col justify-end flex-1">
          <p className={`${valueClasses} text-[#F97316] dark:text-[#F97316]`}>
            <span className="text-[#F97316] dark:text-[#F97316] opacity-85 text-[28px]">
              ₱
            </span>
            {formatCurrencyWhole(statistics.pendingRevenue)}
          </p>
          <p className={subtextClasses}>&nbsp;</p>
        </div>
      </div>

      {/* Total Revenue Card */}
      <div className={cardBaseClasses}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`${iconBaseClasses} bg-[#6366F1]/85`}>
            <DollarSign className="h-3.5 w-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className={titleClasses}>Total Revenue</p>
        </div>
        <div className="flex flex-col justify-end flex-1">
          <p className={`${valueClasses} text-[#334155] dark:text-[#F1F5F9]`}>
            <span className="text-[#334155] dark:text-[#F1F5F9] opacity-85 text-[28px]">
              ₱
            </span>
            {formatCurrencyWhole(statistics.totalRevenue)}
          </p>
          <p className={subtextClasses}>
            Yesterday: ₱{formatCurrencyWhole(statistics.yesterdayRevenue)}
          </p>
        </div>
      </div>

      {/* Total Loads Card */}
      <div className={cardBaseClasses}>
        <div className="flex items-center gap-2 mb-2">
          <div className={`${iconBaseClasses} bg-[#4F46E5]/85`}>
            <Layers className="h-3.5 w-3.5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className={titleClasses}>Total Loads</p>
        </div>
        <div className="flex flex-col justify-end flex-1">
          <p className={`${valueClasses} text-[#4F46E5] dark:text-[#4F46E5]`}>
            {statistics.totalLoads.toLocaleString()}
          </p>
          <p className={subtextClasses}>
            {statistics.todayLoads.toLocaleString()} loads today
          </p>
        </div>
      </div>
    </div>
  );
}
