'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Inbox, CalendarIcon } from 'lucide-react';
import { useAuthSession } from '@/hooks/use-auth-session';
import { supabase } from '@/lib/supabase-client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { SalaryCalendar } from '@/components/salary-calendar';

type SalaryRecord = {
  id: string;
  staff_id: string | null;
  branch_id: string | null;
  amount: number;
  period_start: string;
  period_end: string;
  is_paid: boolean;
  created_at: string;
  updated_at: string;
};

export default function EmployeeSalaryPage() {
  const { user } = useAuthSession();
  const [salaries, setSalaries] = useState<SalaryRecord[]>([]);
  const [allSalaries, setAllSalaries] = useState<SalaryRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchSalaries();
  }, [user]);

  const fetchSalaries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('salaries')
        .select('*')
        .eq('staff_id', user.id)
        .order('period_end', { ascending: false });

      if (error) {
        console.error('Failed to load salaries', error);
        setAllSalaries([]);
        setSalaries([]);
      } else {
        setAllSalaries(data || []);
        setSalaries(data || []);
      }
    } catch (error) {
      console.error('Error fetching salaries', error);
      setAllSalaries([]);
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployeeSalaries = (from: string, to: string) => {
    if (!from) {
      setSalaries(allSalaries);
      return;
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const filtered = allSalaries.filter(salary => {
      const periodStart = new Date(salary.period_start);
      const periodEnd = new Date(salary.period_end);
      
      // Check if salary period overlaps with selected date range
      return (
        (periodStart <= toDate && periodEnd >= fromDate) ||
        (periodStart >= fromDate && periodStart <= toDate) ||
        (periodEnd >= fromDate && periodEnd <= toDate)
      );
    });
    
    setSalaries(filtered);
  };

  useEffect(() => {
    if (!dateRange.start) {
      setSalaries(allSalaries);
    } else {
      const from = dateRange.start.toISOString().split("T")[0];
      const to = dateRange.end 
        ? dateRange.end.toISOString().split("T")[0] 
        : dateRange.start.toISOString().split("T")[0];
      filterEmployeeSalaries(from, to);
    }
  }, [dateRange, allSalaries]);

  const handleCalendarApply = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
    setCalendarOpen(false);
  };

  const handleClearFilter = () => {
    setDateRange({ start: null, end: null });
    setCalendarOpen(false);
  };

  const totalAmount = salaries.reduce((sum, salary) => sum + salary.amount, 0);
  const paidAmount = salaries
    .filter(s => s.is_paid)
    .reduce((sum, salary) => sum + salary.amount, 0);
  const unpaidAmount = totalAmount - paidAmount;

  return (
    <Card className="w-full flex flex-col max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-14rem)]">
      <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background z-10 border-b rounded-t-lg">
        <div>
          <CardTitle>My Salary</CardTitle>
          <CardDescription>View your salary records and payment history.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto overflow-x-hidden scrollable pt-4 pb-4">
        {/* Calendar Date Range Filter */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-4">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[280px] justify-start text-left font-normal",
                      !dateRange.start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.start 
                      ? dateRange.end && dateRange.end.getTime() !== dateRange.start.getTime()
                        ? `${format(dateRange.start, "MMM dd, yyyy")} - ${format(dateRange.end, "MMM dd, yyyy")}`
                        : format(dateRange.start, "PPP")
                      : "Pick a date range to filter"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <SalaryCalendar onApply={handleCalendarApply} onClose={() => setCalendarOpen(false)} />
                </PopoverContent>
              </Popover>
              {dateRange.start && (
                <Button onClick={handleClearFilter} variant="outline" size="sm">
                  Clear Filter
                </Button>
              )}
            </div>
            {dateRange.start && (
              <div className="text-sm text-muted-foreground">
                Showing salaries for: <span className="font-semibold text-foreground">
                  {dateRange.end && dateRange.end.getTime() !== dateRange.start.getTime()
                    ? `${format(dateRange.start, "MMM dd, yyyy")} - ${format(dateRange.end, "MMM dd, yyyy")}`
                    : format(dateRange.start, "PPP")
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {salaries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Total Salary</div>
                <div className="text-2xl font-bold text-primary">₱{totalAmount.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Paid</div>
                <div className="text-2xl font-bold text-green-600">₱{paidAmount.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Pending</div>
                <div className="text-2xl font-bold text-orange-600">₱{unpaidAmount.toFixed(2)}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Salary History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Salary History</h3>
            <span className="text-sm text-muted-foreground">
              {dateRange.start 
                ? `${salaries.length} record${salaries.length !== 1 ? 's' : ''} found`
                : `Total: ${allSalaries.length} record${allSalaries.length !== 1 ? 's' : ''}`
              }
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
              <Loader2 className="h-12 w-12 mb-2 animate-spin" />
              <p>Loading salary records...</p>
            </div>
          ) : salaries.length > 0 ? (
            <div className="border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-right">Date Recorded</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaries.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {format(new Date(salary.period_start), 'MMM dd, yyyy')}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            to {format(new Date(salary.period_end), 'MMM dd, yyyy')}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        ₱{salary.amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-center">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            salary.is_paid
                              ? 'bg-green-100 text-green-800'
                              : 'bg-orange-100 text-orange-800'
                          }`}
                        >
                          {salary.is_paid ? 'Paid' : 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right text-sm text-muted-foreground">
                        {format(new Date(salary.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground border rounded-lg bg-card p-8">
              <Inbox className="h-12 w-12 mb-2" />
              <h3 className="text-lg font-semibold mb-1">No Salary Records</h3>
            <p className="text-sm">
              {dateRange.start
                ? 'No salary records found for the selected date range.'
                : 'You don\'t have any salary records yet.'}
            </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

