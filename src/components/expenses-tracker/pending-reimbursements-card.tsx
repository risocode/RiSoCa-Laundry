"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import type { Expense } from './types';
import { formatCurrency } from '@/lib/utils';

interface PendingReimbursementsCardProps {
  pendingTotal: number;
  pendingRacky: number;
  pendingKaraya: number;
  pendingRichard: number;
  pendingExpenses: Expense[];
  bulkReimbursing: boolean;
  onReimburseByPerson: (person: 'Racky' | 'Karaya' | 'Richard') => void;
}

export function PendingReimbursementsCard({
  pendingTotal,
  pendingRacky,
  pendingKaraya,
  pendingRichard,
  pendingExpenses,
  bulkReimbursing,
  onReimburseByPerson,
}: PendingReimbursementsCardProps) {
  if (pendingTotal <= 0) return null;

  return (
    <Card className="border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 shadow-lg">
      <CardHeader>
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertCircle className="h-5 w-5 text-orange-600" />
            Pending Reimbursements
          </CardTitle>
          <CardDescription className="mt-1">
            Personal expenses awaiting reimbursement - Click to reimburse by owner
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          {pendingRacky > 0 && (
            <div className="border-2 border-orange-200 rounded-lg p-4 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Racky</div>
                  <div className="font-bold text-lg text-orange-700 dark:text-orange-400 mt-1">
                    ₱{formatCurrency(pendingRacky)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {pendingExpenses.filter(e => e.expense_for === 'Racky').length} expense(s)
                  </div>
                </div>
              </div>
              <Button
                onClick={() => onReimburseByPerson('Racky')}
                disabled={bulkReimbursing}
                size="sm"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {bulkReimbursing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Reimburse Racky
                  </>
                )}
              </Button>
            </div>
          )}

          {pendingKaraya > 0 && (
            <div className="border-2 border-orange-200 rounded-lg p-4 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Karaya</div>
                  <div className="font-bold text-lg text-orange-700 dark:text-orange-400 mt-1">
                    ₱{formatCurrency(pendingKaraya)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {pendingExpenses.filter(e => e.expense_for === 'Karaya').length} expense(s)
                  </div>
                </div>
              </div>
              <Button
                onClick={() => onReimburseByPerson('Karaya')}
                disabled={bulkReimbursing}
                size="sm"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {bulkReimbursing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Reimburse Karaya
                  </>
                )}
              </Button>
            </div>
          )}

          {pendingRichard > 0 && (
            <div className="border-2 border-orange-200 rounded-lg p-4 bg-white dark:bg-gray-900">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="text-xs text-muted-foreground font-medium">Richard</div>
                  <div className="font-bold text-lg text-orange-700 dark:text-orange-400 mt-1">
                    ₱{formatCurrency(pendingRichard)}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {pendingExpenses.filter(e => e.expense_for === 'Richard').length} expense(s)
                  </div>
                </div>
              </div>
              <Button
                onClick={() => onReimburseByPerson('Richard')}
                disabled={bulkReimbursing}
                size="sm"
                className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              >
                {bulkReimbursing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Reimburse Richard
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
        <div className="pt-3 border-t">
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold">Total Pending:</span> ₱{formatCurrency(pendingTotal)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
