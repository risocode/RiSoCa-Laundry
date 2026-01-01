"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DollarSign, TrendingUp, TrendingDown, Share2, Calendar, Loader2, X } from 'lucide-react';
import type { DistributionData } from './types';

interface SummaryCardsProps {
  distributionData: DistributionData;
  bankSavings: number;
  showCustomTransfer: boolean;
  customTransferAmount: string;
  savingBankSavings: boolean;
  distributionPeriod: 'monthly' | 'yearly' | 'all';
  selectedOwnersCount: number;
  onCustomTransferAmountChange: (value: string) => void;
  onShowCustomTransfer: () => void;
  onHideCustomTransfer: () => void;
  onDepositBankSavings: (amount: number) => Promise<void>;
}

export function SummaryCards({
  distributionData,
  bankSavings,
  showCustomTransfer,
  customTransferAmount,
  savingBankSavings,
  distributionPeriod,
  selectedOwnersCount,
  onCustomTransferAmountChange,
  onShowCustomTransfer,
  onHideCustomTransfer,
  onDepositBankSavings,
}: SummaryCardsProps) {
  const handleDeposit = async () => {
    const amount = parseFloat(customTransferAmount);
    if (!isNaN(amount) && amount > 0) {
      await onDepositBankSavings(amount);
      onHideCustomTransfer();
    }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
          <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600 dark:text-green-400">
            ₱{distributionData.totalRevenue.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {distributionData.period}
          </p>
        </CardContent>
      </Card>

      <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400">
            ₱{distributionData.totalExpenses.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Business expenses only
          </p>
        </CardContent>
      </Card>

      <Card className={`${distributionData.netIncome >= 0 ? 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20' : 'border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20'} dark:to-background`}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Net Income</CardTitle>
          <div className={`h-10 w-10 rounded-full ${distributionData.netIncome >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} flex items-center justify-center`}>
            <TrendingUp className={`h-5 w-5 ${distributionData.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
          </div>
        </CardHeader>
        <CardContent>
          <div className={`text-2xl font-bold ${distributionData.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
            ₱{distributionData.netIncome.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Revenue - Expenses
          </p>
        </CardContent>
      </Card>

      <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Bank Savings</CardTitle>
          <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              ₱{bankSavings.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Deducted from net income
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Available for Distribution</CardTitle>
          <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
            ₱{distributionData.availableForDistribution.toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground mt-1 mb-3">
            Net Income - Bank Savings
          </p>
          {distributionData.availableForDistribution > 0 && (
            <div className="flex flex-col gap-2 pt-2 border-t">
              {showCustomTransfer ? (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={customTransferAmount}
                      onChange={(e) => onCustomTransferAmountChange(e.target.value)}
                      className="h-9 text-sm flex-1"
                      placeholder="Enter amount"
                      disabled={savingBankSavings}
                    />
                    <Button
                      size="sm"
                      variant="default"
                      onClick={handleDeposit}
                      className="h-9 text-sm"
                      disabled={savingBankSavings}
                    >
                      {savingBankSavings ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Depositing...
                        </>
                      ) : (
                        'Deposit'
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={onHideCustomTransfer}
                      className="h-9 w-9 p-0"
                      disabled={savingBankSavings}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Available: ₱{distributionData.availableForDistribution.toFixed(2)}
                  </p>
                </div>
              ) : (
                <Button
                  size="sm"
                  variant="default"
                  onClick={onShowCustomTransfer}
                  className="h-9 text-sm"
                  disabled={savingBankSavings}
                >
                  Deposit
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-white dark:from-primary/10 dark:to-background">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Per Owner Share</CardTitle>
          <div className="h-10 w-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
            <Share2 className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-primary">
            ₱{selectedOwnersCount > 0 ? (distributionData.availableForDistribution / selectedOwnersCount).toFixed(2) : '0.00'}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {selectedOwnersCount > 0 ? `${(100 / selectedOwnersCount).toFixed(2)}% each` : 'No owners selected'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
