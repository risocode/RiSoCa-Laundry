'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Trash2, Inbox, Loader2, Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import {
  addElectricityReading,
  deleteElectricityReading,
  fetchElectricityReadings,
  type ElectricityReading,
} from '@/lib/api/electricity';
import { useAuthSession } from '@/hooks/use-auth-session';
import { formatCurrencyWhole } from '@/lib/utils';

const electricitySchema = z.object({
  reading: z.coerce.number().min(0, 'Reading must be greater than or equal to 0'),
  reading_date: z.string().min(1, 'Date is required'),
});

type ElectricityFormData = z.infer<typeof electricitySchema>;

export function ElectricityTracker() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuthSession();
  const [readings, setReadings] = useState<ElectricityReading[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [pricePerKwh, setPricePerKwh] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('electricity_price_per_kwh');
      return saved ? parseFloat(saved) : 0;
    }
    return 0;
  });
  const [isEditingPrice, setIsEditingPrice] = useState(false);
  const [priceInputValue, setPriceInputValue] = useState<string>('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ElectricityFormData>({
    resolver: zodResolver(electricitySchema),
    defaultValues: {
      reading: 0,
      reading_date: new Date().toISOString().slice(0, 10), // Today's date in YYYY-MM-DD format
    },
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await fetchElectricityReadings();
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Load failed',
        description: error.message,
      });
      setLoading(false);
      return;
    }
    setReadings(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // Calculate statistics
  const calculateStats = () => {
    if (readings.length === 0) {
      return {
        totalDays: 0,
        consumption: 0,
        total: 0,
      };
    }

    // Sort readings by date (oldest first)
    const sortedReadings = [...readings].sort(
      (a, b) => new Date(a.reading_date).getTime() - new Date(b.reading_date).getTime()
    );

    const lastReading = sortedReadings[sortedReadings.length - 1];

    // Business opening date: December 5
    // Use the year of the first reading, or current year if no readings
    const firstReadingYear = sortedReadings.length > 0 
      ? new Date(sortedReadings[0].reading_date).getFullYear()
      : new Date().getFullYear();
    const businessStartDate = new Date(firstReadingYear, 11, 5); // December 5 (month is 0-indexed, so 11 = December)

    // Calculate total days from business opening (December 5) to last reading
    const lastDate = new Date(lastReading.reading_date);
    const totalDays = Math.ceil(
      (lastDate.getTime() - businessStartDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Consumption is just the last reading value
    const consumption = lastReading.reading;

    // Calculate total cost
    const total = consumption * pricePerKwh;

    return {
      totalDays,
      consumption,
      total,
    };
  };

  const stats = calculateStats();

  const handlePriceEdit = () => {
    setPriceInputValue(pricePerKwh.toString());
    setIsEditingPrice(true);
  };

  const handlePriceSave = () => {
    const newPrice = parseFloat(priceInputValue);
    if (isNaN(newPrice) || newPrice < 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Price',
        description: 'Please enter a valid price (number >= 0)',
      });
      return;
    }
    // Check if price changed
    if (newPrice === pricePerKwh) {
      setIsEditingPrice(false);
      setPriceInputValue('');
      return;
    }
    setPricePerKwh(newPrice);
    if (typeof window !== 'undefined') {
      localStorage.setItem('electricity_price_per_kwh', newPrice.toString());
    }
    setIsEditingPrice(false);
    toast({
      title: 'Price Updated',
      description: `Price per kWh set to ₱${formatCurrencyWhole(newPrice)}`,
    });
  };

  const handlePriceCancel = () => {
    setIsEditingPrice(false);
    setPriceInputValue('');
  };

  const onAddReading = async (data: ElectricityFormData) => {
    if (authLoading || !user) {
      toast({
        variant: 'destructive',
        title: 'Please log in',
        description: 'Admin sign-in required.',
      });
      return;
    }
    setSaving(true);
    const { error } = await addElectricityReading({
      reading: data.reading,
      reading_date: data.reading_date,
    });
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Save failed',
        description: error.message,
      });
      setSaving(false);
      return;
    }
    toast({
      title: 'Reading Added',
      description: `Electricity reading of ${data.reading} kWh for ${format(new Date(data.reading_date), 'MMM dd, yyyy')} has been recorded.`,
    });
    reset();
    setIsDialogOpen(false);
    setSaving(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteElectricityReading(id);
    if (error) {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: error.message,
      });
      return;
    }
    toast({
      variant: 'destructive',
      title: 'Reading Removed',
    });
    load();
  };

  return (
    <div className="space-y-4">
      {/* Calculation Card */}
      <Card>
        <CardHeader>
          <CardTitle>Electricity Cost Calculation</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Total Days</Label>
              <p className="text-lg font-semibold">{stats.totalDays} days</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Current Reading / Consumption</Label>
              <p className="text-lg font-semibold">{stats.consumption.toFixed(2)} kWh</p>
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Price/kWh</Label>
              {isEditingPrice ? (
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    step="0.01"
                    value={priceInputValue}
                    onChange={(e) => setPriceInputValue(e.target.value)}
                    className="w-24 h-8 text-sm"
                    placeholder="0.00"
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handlePriceSave}
                    disabled={(() => {
                      const newPrice = parseFloat(priceInputValue);
                      return isNaN(newPrice) || newPrice < 0 || newPrice === pricePerKwh;
                    })()}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handlePriceCancel}
                  >
                    <X className="h-4 w-4 text-red-600" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <p className="text-lg font-semibold">₱{formatCurrencyWhole(pricePerKwh)}</p>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8"
                    onClick={handlePriceEdit}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="space-y-1">
              <Label className="text-sm text-muted-foreground">Total</Label>
              <p className="text-lg font-semibold text-primary">₱{formatCurrencyWhole(stats.total)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Reading
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Electricity Reading</DialogTitle>
              <DialogDescription>
                Enter the electricity meter reading and date
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit(onAddReading)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reading_date">Date</Label>
                <Input
                  id="reading_date"
                  type="date"
                  {...register('reading_date')}
                  disabled={saving}
                />
                {errors.reading_date && (
                  <p className="text-sm text-red-500">
                    {errors.reading_date.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="reading">Reading (kWh)</Label>
                <Input
                  id="reading"
                  type="number"
                  step="0.01"
                  placeholder="17.01"
                  {...register('reading')}
                  disabled={saving}
                />
                {errors.reading && (
                  <p className="text-sm text-red-500">
                    {errors.reading.message}
                  </p>
                )}
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setIsDialogOpen(false);
                    reset();
                  }}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save'
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
          <Loader2 className="h-12 w-12 mb-2 animate-spin" />
          <p>Loading electricity readings...</p>
        </div>
      ) : readings.length > 0 ? (
        <div className="w-full overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Reading (kWh)</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {readings.map((reading) => (
                <TableRow key={reading.id}>
                  <TableCell>
                    {format(new Date(reading.reading_date), 'MMM dd, yyyy')}
                  </TableCell>
                  <TableCell className="text-right font-medium">
                    {reading.reading.toFixed(2)} kWh
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(reading.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
          <Inbox className="h-12 w-12 mb-2" />
          <p>No electricity readings recorded yet.</p>
        </div>
      )}
    </div>
  );
}

