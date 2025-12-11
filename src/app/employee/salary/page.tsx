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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Loader2, Inbox, Calendar } from 'lucide-react';
import { useAuthSession } from '@/hooks/use-auth-session';
import { supabase } from '@/lib/supabase-client';
import { format } from 'date-fns';

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
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  useEffect(() => {
    if (!user) return;
    fetchSalaries();
  }, [user]);

  const fetchSalaries = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      let query = supabase
        .from('salaries')
        .select('*')
        .eq('staff_id', user.id)
        .order('period_end', { ascending: false });

      // Apply date filters if provided
      if (startDate) {
        query = query.gte('period_end', startDate);
      }
      if (endDate) {
        query = query.lte('period_start', endDate);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Failed to load salaries', error);
        setSalaries([]);
      } else {
        setSalaries(data || []);
      }
    } catch (error) {
      console.error('Error fetching salaries', error);
      setSalaries([]);
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    fetchSalaries();
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    // Fetch without filters after clearing
    setTimeout(() => {
      fetchSalaries();
    }, 0);
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
        {/* Date Filter */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/50">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1 grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start-date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Start Date
                </Label>
                <Input
                  id="start-date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end-date" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  End Date
                </Label>
                <Input
                  id="end-date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleFilter} variant="default">
                Filter
              </Button>
              <Button onClick={handleClearFilter} variant="outline">
                Clear
              </Button>
            </div>
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

        {/* Salary Table */}
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
              {startDate || endDate
                ? 'No salary records found for the selected date range.'
                : 'You don\'t have any salary records yet.'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

