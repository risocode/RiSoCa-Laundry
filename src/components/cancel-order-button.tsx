'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { X, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cancelOrderByCustomer } from '@/lib/api/orders';
import { useAuthSession } from '@/hooks/use-auth-session';
import Link from 'next/link';

interface CancelOrderButtonProps {
  orderId: string;
  orderStatus: string;
  onCancelSuccess: () => void;
}

export function CancelOrderButton({ orderId, orderStatus, onCancelSuccess }: CancelOrderButtonProps) {
  const { user } = useAuthSession();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCanceling, setIsCanceling] = useState(false);

  // Only show cancel button for "Order Created" status
  if (orderStatus !== 'Order Created') {
    // Show message with link to contact us for orders beyond "Order Created"
    if (orderStatus !== 'Canceled') {
      return (
        <div className="mt-4 p-4 border border-dashed rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground mb-2">
            This order cannot be cancelled online. Please contact us to request cancellation.
          </p>
          <Link href="/contact-us">
            <Button variant="outline" size="sm" className="w-full">
              Contact Us
            </Button>
          </Link>
        </div>
      );
    }
    return null;
  }

  const handleCancel = async () => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to cancel your order.',
      });
      return;
    }

    setIsCanceling(true);
    const { error } = await cancelOrderByCustomer(orderId, user.id);

    if (error) {
      toast({
        variant: 'destructive',
        title: 'Cancellation Failed',
        description: error.message || 'Could not cancel order. Please try again or contact support.',
      });
      setIsCanceling(false);
      return;
    }

    toast({
      title: 'Order Cancelled',
      description: 'Your order has been successfully cancelled.',
    });

    setIsDialogOpen(false);
    setIsCanceling(false);
    onCancelSuccess();
  };

  return (
    <>
      <Button
        variant="destructive"
        onClick={() => setIsDialogOpen(true)}
        className="w-full mt-4"
      >
        <X className="h-4 w-4 mr-2" />
        Cancel Order
      </Button>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Order</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCanceling}>Keep Order</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCanceling}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isCanceling ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                'Cancel Order'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

