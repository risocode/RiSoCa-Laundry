'use client';

import { ServiceRatesEditor } from '@/components/service-rates-editor';

export default function AdminServiceRatesPage() {
  return (
    <div className="flex flex-col md:flex-row items-center md:items-start md:justify-center gap-8">
      <div className="flex flex-col items-center md:items-start text-center md:text-left mb-8 md:mb-0 md:w-1/4">
        <h1 className="text-2xl md:text-4xl font-bold text-primary">Manage Service Rates</h1>
        <p className="text-sm md:text-lg text-muted-foreground mt-2">Update pricing for services and delivery.</p>
      </div>
      
      <div className="w-full md:w-3/4 max-w-4xl">
        <ServiceRatesEditor />
      </div>
    </div>
  );
}
