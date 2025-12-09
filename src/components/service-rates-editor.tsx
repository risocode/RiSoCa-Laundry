'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchServiceRates, updateServiceRate, type ServiceRate } from '@/lib/api/rates';

export function ServiceRatesEditor() {
  const { toast } = useToast();
  
  const [initialRates, setInitialRates] = useState<ServiceRate[]>([]);
  const [rates, setRates] = useState<ServiceRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const { data, error } = await fetchServiceRates();
      if (error) {
        console.error('Failed to load rates', error);
        toast({ variant: 'destructive', title: 'Load error', description: 'Could not load service rates.' });
        setLoading(false);
        return;
      }
      const fetched = data ?? [];
      setInitialRates(fetched);
      setRates(fetched);
      setLoading(false);
    };
    load();
  }, []);

  const handlePriceChange = (id: string, newPrice: string) => {
    const numericPrice = parseFloat(newPrice) || 0;
    setRates(currentRates =>
      currentRates.map(rate => (rate.id === id ? { ...rate, price: numericPrice } : rate))
    );
  };

  const handleSave = async () => {
    setSaving(true);
    for (const rate of rates) {
      const original = initialRates.find(r => r.id === rate.id);
      if (!original || original.price !== rate.price) {
        const { error } = await updateServiceRate(rate.id, rate.price);
        if (error) {
          toast({ variant: 'destructive', title: 'Save failed', description: error.message });
          setSaving(false);
          return;
        }
      }
    }
    setInitialRates(rates);
    toast({
      title: 'Success!',
      description: 'Service rates have been updated.',
    });
    setIsEditing(false);
    setSaving(false);
  };
  
  const handleCancel = () => {
    setRates(initialRates);
    setIsEditing(false);
  };

  const renderTable = (type: 'service' | 'delivery', title: string) => {
    const filteredRates = rates.filter(rate => rate.type === type);
    const headers = type === 'service' ? ['Service', 'Price (₱)'] : ['Distance', 'Price (₱)'];

    return (
      <Card>
        <CardHeader className="p-4">
          <CardTitle className="text-lg">{title}</CardTitle>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="h-8 text-xs">{headers[0]}</TableHead>
                <TableHead className="text-right h-8 text-xs">{headers[1]}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRates.map(item => (
                <TableRow key={item.id}>
                  <TableCell className="p-2 text-xs">{item.name}</TableCell>
                  <TableCell className="text-right p-2 text-xs">
                    {isEditing ? (
                      <Input
                        type="number"
                        value={item.price}
                        onChange={(e) => handlePriceChange(item.id, e.target.value)}
                        className="h-8 text-right"
                        disabled={saving}
                      />
                    ) : (
                      item.price === 0 && item.id.startsWith('delivery') ? 'Free' : item.price.toFixed(2)
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
         {isEditing && (
            <CardFooter className="p-4 pt-0 justify-end">
                {/* Footer content will be handled globally below the grid */}
            </CardFooter>
         )}
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8">
        {renderTable('service', 'Standard Services')}
        {renderTable('delivery', 'Delivery Surcharges')}
      </div>
       <div className="mt-6 flex justify-end gap-2">
            {isEditing ? (
                <>
                    <Button variant="outline" onClick={handleCancel} disabled={saving}>
                        <X className="mr-2 h-4 w-4" /> Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </>
            ) : (
                <Button onClick={() => setIsEditing(true)}>
                    <Edit className="mr-2 h-4 w-4" /> Edit Rates
                </Button>
            )}
        </div>
    </div>
  );
}
