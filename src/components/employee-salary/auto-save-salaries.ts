import { format, startOfDay } from 'date-fns';
import { supabase } from '@/lib/supabase-client';
import type { Order } from '@/components/order-list';
import type { Employee } from './types';
import { ELIGIBLE_STATUSES, SALARY_PER_LOAD } from './types';
import { calculateEmployeeSalary } from './calculate-salary';
import { fetchDailyPayments } from './fetch-data';

export async function autoSaveDailySalaries(
  dateStrings: string[],
  currentOrders: Order[],
  currentEmployees: Employee[]
): Promise<void> {
  if (currentEmployees.length === 0 || currentOrders.length === 0) return;

  const myraEmployee = currentEmployees.find(e => 
    e.first_name?.toUpperCase() === 'MYRA' || 
    e.first_name?.toUpperCase() === 'MYRA GAMMAL'
  );

  const savePromises: Promise<void>[] = [];

  dateStrings.forEach(dateStr => {
    const dayOrders = currentOrders.filter(order => {
      const orderDateKey = format(startOfDay(new Date(order.orderDate)), 'yyyy-MM-dd');
      return orderDateKey === dateStr && ELIGIBLE_STATUSES.includes(order.status);
    });

    currentEmployees.forEach(emp => {
      const calculatedSalary = calculateEmployeeSalary(dayOrders, emp, currentEmployees);

      savePromises.push(
        (async () => {
          try {
            const { data: existing, error: checkError } = await supabase
              .from('daily_salary_payments')
              .select('id, amount')
              .eq('employee_id', emp.id)
              .eq('date', dateStr)
              .maybeSingle();

            if (!existing && !checkError) {
              const { error } = await supabase
                .from('daily_salary_payments')
                .insert({
                  employee_id: emp.id,
                  date: dateStr,
                  amount: calculatedSalary,
                  is_paid: false,
                  updated_at: new Date().toISOString(),
                });

              if (error) {
                console.error(`Failed to auto-save salary for ${emp.id} on ${dateStr}:`, error);
              }
            } else if (existing && !checkError) {
              // Only update the amount if it matches the calculated salary (within tolerance)
              // This preserves manually edited amounts that differ from calculated
              const existingAmount = existing.amount || 0;
              const calculatedRounded = Math.round(calculatedSalary * 100) / 100;
              const existingRounded = Math.round(existingAmount * 100) / 100;
              
              // If amounts match (within 0.01), update to ensure sync
              // If amounts differ significantly, preserve the manual edit
              if (Math.abs(existingRounded - calculatedRounded) < 0.01) {
                const { error } = await supabase
                  .from('daily_salary_payments')
                  .update({
                    amount: calculatedSalary,
                    updated_at: new Date().toISOString(),
                  })
                  .eq('employee_id', emp.id)
                  .eq('date', dateStr);

                if (error) {
                  console.error(`Failed to auto-save salary for ${emp.id} on ${dateStr}:`, error);
                }
              }
              // If amounts differ significantly, don't update - preserve manual edit
            }
          } catch (error: any) {
            console.error(`Error checking/inserting salary for ${emp.id} on ${dateStr}:`, error);
          }
        })()
      );
    });
  });

  if (savePromises.length > 0) {
    await Promise.all(savePromises);
    for (const dateStr of dateStrings) {
      await fetchDailyPayments(dateStr);
    }
  }
}
