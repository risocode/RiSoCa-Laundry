'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Loader2, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchBranches, createBranch, updateBranch, deleteBranch } from '@/lib/api/branches';

const branchSchema = z.object({
  name: z.string().min(2, 'Name is required'),
  address: z.string().optional(),
  phone: z.string().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  is_active: z.boolean().default(true),
});

type BranchForm = z.infer<typeof branchSchema>;

export default function AdminBranchesPage() {
  const { toast } = useToast();
  const [branches, setBranches] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, formState: { errors }, setValue } = useForm<BranchForm>({
    resolver: zodResolver(branchSchema),
    defaultValues: { name: '', address: '', phone: '', latitude: undefined, longitude: undefined, is_active: true },
  });

  const load = async () => {
    setLoading(true);
    const { data, error } = await fetchBranches();
    if (error) {
      toast({ variant: 'destructive', title: 'Load failed', description: error.message });
      setLoading(false);
      return;
    }
    setBranches(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onSubmit = async (values: BranchForm) => {
    setSaving(true);
    const { error } = await createBranch(values);
    if (error) {
      toast({ variant: 'destructive', title: 'Create failed', description: error.message });
      setSaving(false);
      return;
    }
    toast({ title: 'Branch created' });
    reset();
    setSaving(false);
    load();
  };

  const toggleActive = async (id: string, next: boolean) => {
    const { error } = await updateBranch(id, { is_active: next });
    if (error) {
      toast({ variant: 'destructive', title: 'Update failed', description: error.message });
      return;
    }
    load();
  };

  const remove = async (id: string) => {
    const { error } = await deleteBranch(id);
    if (error) {
      toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
      return;
    }
    load();
  };

  return (
    <div className="w-full max-w-5xl px-2 sm:px-0 space-y-6">
      <div className="flex flex-col items-center text-center">
        <h1 className="text-2xl md:text-4xl font-bold text-primary">Branches</h1>
        <p className="text-sm md:text-lg text-muted-foreground mt-2">Manage branch info and activation.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add Branch</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label htmlFor="name">Name</Label>
              <Input id="name" {...register('name')} disabled={saving} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" {...register('phone')} disabled={saving} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label htmlFor="address">Address</Label>
              <Input id="address" {...register('address')} disabled={saving} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="latitude">Latitude</Label>
              <Input id="latitude" type="number" step="0.000001" {...register('latitude')} disabled={saving} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="longitude">Longitude</Label>
              <Input id="longitude" type="number" step="0.000001" {...register('longitude')} disabled={saving} />
            </div>
            <div className="flex items-center gap-2">
              <Switch id="is_active" defaultChecked onCheckedChange={(v) => setValue('is_active', v)} />
              <Label htmlFor="is_active">Active</Label>
            </div>
            <div className="md:col-span-2 flex justify-end">
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Branch
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Branch List</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <div className="flex justify-center py-8 text-muted-foreground">
              <Loader2 className="h-6 w-6 animate-spin" />
            </div>
          ) : branches.length === 0 ? (
            <p className="text-muted-foreground">No branches yet.</p>
          ) : (
            branches.map((b) => (
              <div key={b.id} className="border rounded-lg p-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="font-semibold">{b.name}</p>
                  {b.address && <p className="text-sm text-muted-foreground">{b.address}</p>}
                  {b.phone && <p className="text-sm text-muted-foreground">{b.phone}</p>}
                  {(b.latitude || b.longitude) && (
                    <p className="text-xs text-muted-foreground">({b.latitude}, {b.longitude})</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Switch checked={b.is_active} onCheckedChange={(v) => toggleActive(b.id, v)} />
                    <span className="text-sm">{b.is_active ? 'Active' : 'Inactive'}</span>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => remove(b.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

