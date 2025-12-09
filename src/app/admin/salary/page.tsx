'use client';

import { EmployeeSalary } from '@/components/employee-salary';

export default function AdminSalaryPage() {
  return (
    <div className="w-full max-w-4xl">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-primary">Employee Salary</h1>
        <p className="text-sm md:text-lg text-muted-foreground mt-2">Calculate employee salary based on completed loads.</p>
      </div>
      
      <EmployeeSalary />
    </div>
  );
}
