'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getAllPromos, createPromo, updatePromo, deletePromo, activatePromo, type Promo } from '@/lib/api/promos';
import { useAuthSession } from '@/hooks/use-auth-session';
import { Loader2, Plus, Edit, Trash2, Power, Calendar, Clock, DollarSign, FileText } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

export default function AdminPromoPage() {
  const { user } = useAuthSession();
  const { toast } = useToast();
  const [promos, setPromos] = useState<Promo[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPromo, setEditingPromo] = useState<Promo | null>(null);
  const [formData, setFormData] = useState({
    date: '',
    startTime: '',
    endTime: '',
    price_per_load: '',
    display_date: '',
  });

  useEffect(() => {
    loadPromos();
  }, []);

  const loadPromos = async () => {
    setLoading(true);
    const { data, error } = await getAllPromos();
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to load promos',
        variant: 'destructive',
      });
    } else {
      setPromos(data || []);
    }
    setLoading(false);
  };

  const resetForm = () => {
    setFormData({
      date: '',
      startTime: '',
      endTime: '',
      price_per_load: '',
      display_date: '',
    });
    setEditingPromo(null);
  };

  const handleOpenDialog = (promo?: Promo) => {
    if (promo) {
      setEditingPromo(promo);
      const startDate = new Date(promo.start_date);
      const endDate = new Date(promo.end_date);
      setFormData({
        date: startDate.toISOString().split('T')[0],
        startTime: startDate.toTimeString().slice(0, 5),
        endTime: endDate.toTimeString().slice(0, 5),
        price_per_load: promo.price_per_load.toString(),
        display_date: promo.display_date,
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.date || !formData.startTime || !formData.endTime || !formData.price_per_load || !formData.display_date) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields',
        variant: 'destructive',
      });
      return;
    }

    const startDate = new Date(`${formData.date}T${formData.startTime}:00`);
    const endDate = new Date(`${formData.date}T${formData.endTime}:00`);

    if (endDate <= startDate) {
      toast({
        title: 'Validation Error',
        description: 'End time must be after start time',
        variant: 'destructive',
      });
      return;
    }

    if (editingPromo) {
      const { error } = await updatePromo(editingPromo.id, {
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        price_per_load: parseFloat(formData.price_per_load),
        display_date: formData.display_date,
        created_by: user?.id,
      });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to update promo',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Promo updated successfully',
        });
        handleCloseDialog();
        loadPromos();
      }
    } else {
      const { error } = await createPromo({
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        price_per_load: parseFloat(formData.price_per_load),
        display_date: formData.display_date,
        is_active: false,
        created_by: user?.id,
      });

      if (error) {
        toast({
          title: 'Error',
          description: 'Failed to create promo',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Success',
          description: 'Promo created successfully. Click "Activate" to enable it.',
        });
        handleCloseDialog();
        loadPromos();
      }
    }
  };

  const handleActivate = async (id: string) => {
    const { error } = await activatePromo(id);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to activate promo',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Promo activated successfully',
      });
      loadPromos();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this promo?')) return;

    const { error } = await deletePromo(id);
    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete promo',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Promo deleted successfully',
      });
      loadPromos();
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isPromoActive = (promo: Promo) => {
    if (!promo.is_active) return false;
    const now = new Date();
    const start = new Date(promo.start_date);
    const end = new Date(promo.end_date);
    return now >= start && now <= end;
  };

  const isPromoUpcoming = (promo: Promo) => {
    if (!promo.is_active) return false;
    const now = new Date();
    const start = new Date(promo.start_date);
    return now < start;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Promo Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage promotional campaigns</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className="h-4 w-4 mr-2" />
              New Promo
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>{editingPromo ? 'Edit Promo' : 'Create New Promo'}</DialogTitle>
              <DialogDescription>
                Set the date, time, and price for your promotional campaign
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startTime">Start Time</Label>
                    <Input
                      id="startTime"
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endTime">End Time</Label>
                    <Input
                      id="endTime"
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price_per_load">Price per Load (₱)</Label>
                  <Input
                    id="price_per_load"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.price_per_load}
                    onChange={(e) => setFormData({ ...formData, price_per_load: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="display_date">Display Date Text</Label>
                  <Input
                    id="display_date"
                    type="text"
                    placeholder="e.g., December 17, 2025"
                    value={formData.display_date}
                    onChange={(e) => setFormData({ ...formData, display_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleCloseDialog}>
                  Cancel
                </Button>
                <Button type="submit">{editingPromo ? 'Update' : 'Create'}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {promos.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center">No promos created yet</p>
            <p className="text-sm text-muted-foreground mt-2 text-center">Create your first promo to get started</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {promos.map((promo) => {
            const active = isPromoActive(promo);
            const upcoming = isPromoUpcoming(promo);
            
            return (
              <Card key={promo.id} className={active ? 'border-green-500 border-2' : promo.is_active ? 'border-yellow-500 border-2' : ''}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <DollarSign className="h-5 w-5 text-primary" />
                        ₱{promo.price_per_load} per load
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <FileText className="h-4 w-4 inline mr-1" />
                        {promo.display_date}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      {active && (
                        <span className="px-2 py-1 text-xs font-semibold bg-green-100 text-green-800 rounded">
                          LIVE
                        </span>
                      )}
                      {upcoming && (
                        <span className="px-2 py-1 text-xs font-semibold bg-yellow-100 text-yellow-800 rounded">
                          UPCOMING
                        </span>
                      )}
                      {!promo.is_active && (
                        <span className="px-2 py-1 text-xs font-semibold bg-gray-100 text-gray-800 rounded">
                          INACTIVE
                        </span>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      <span>Start: {formatDateTime(promo.start_date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>End: {formatDateTime(promo.end_date)}</span>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    {!promo.is_active && (
                      <Button
                        size="sm"
                        variant="default"
                        onClick={() => handleActivate(promo.id)}
                        className="flex-1"
                      >
                        <Power className="h-4 w-4 mr-1" />
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleOpenDialog(promo)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(promo.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

