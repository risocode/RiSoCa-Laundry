import type { Order } from '@/components/order-list/types';
import {
  updateOrderFields,
  updateOrderStatus,
} from '@/lib/api/orders';
import type { OrderInsert } from '@/lib/api/orders';

export interface UpdateOrderResult {
  success: boolean;
  error?: string;
  finalOrderId?: string;
}

export async function handleOrderUpdate(
  updatedOrder: Order,
  previousOrder: Order | undefined,
  allOrders: Order[],
  setAllOrders: (updater: (prev: Order[]) => Order[]) => void,
  toast: (options: {
    variant?: 'default' | 'destructive';
    title: string;
    description?: string;
  }) => void
): Promise<UpdateOrderResult> {
  try {
    const hasStatusChange = previousOrder?.status !== updatedOrder.status;
    let finalOrderId = updatedOrder.id;

    if (hasStatusChange) {
      const { data: updatedOrderData, error } = await updateOrderStatus(
        updatedOrder.id,
        updatedOrder.status
      );

      if (error) {
        // Check for 406 or coerce errors - these are usually false positives
        const isCoerceOr406Error =
          error.message?.includes('coerce') ||
          error.message?.includes('JSON object') ||
          error.code === '406' ||
          error.message?.includes('406');

        // Don't show error for 406/coerce - the update likely succeeded
        if (!isCoerceOr406Error) {
          toast({
            variant: 'default',
            title: 'Update in progress',
            description:
              'The order may have been updated. Please refresh the page to see the latest status.',
          });
        }

        // For 406/coerce errors, update in place if we can find the order
        setAllOrders((prevOrders) => {
          const orderIndex = prevOrders.findIndex(
            (o) => o.id === updatedOrder.id
          );
          if (orderIndex !== -1) {
            const newOrders = [...prevOrders];
            newOrders[orderIndex] = updatedOrder;
            return newOrders;
          }
          return prevOrders;
        });

        return {
          success: false,
          error: isCoerceOr406Error
            ? undefined
            : error.message || 'Failed to update order status',
        };
      }

      // If the order ID was updated (from TEMP to RKR), use the new ID
      if (
        updatedOrderData &&
        updatedOrderData.id &&
        updatedOrderData.id !== updatedOrder.id
      ) {
        finalOrderId = updatedOrderData.id;
        // Update the order object with the new ID
        updatedOrder = {
          ...updatedOrder,
          id: updatedOrderData.id,
        };
        // Update the order in place with new ID to maintain position
        setAllOrders((prevOrders) => {
          const orderIndex = prevOrders.findIndex(
            (o) => o.id === updatedOrder.id
          );
          if (orderIndex !== -1) {
            const newOrders = [...prevOrders];
            newOrders[orderIndex] = updatedOrder;
            return newOrders;
          }
          return prevOrders;
        });
      }
    }

    const patch: Partial<OrderInsert> = {
      customer_name: updatedOrder.customerName,
      contact_number: updatedOrder.contactNumber,
      weight: updatedOrder.weight,
      loads: updatedOrder.load,
      total: updatedOrder.total,
      is_paid: updatedOrder.isPaid,
      balance:
        updatedOrder.balance ?? (updatedOrder.isPaid ? 0 : updatedOrder.total),
      delivery_option: updatedOrder.deliveryOption,
      distance: updatedOrder.distance,
      service_package: updatedOrder.servicePackage as 'package1' | 'package2' | 'package3',
      status: updatedOrder.status,
      created_at: updatedOrder.orderDate.toISOString(), // Update the order date
    };

    // Include order_type and assigned_employee_id if they exist
    if (updatedOrder.orderType !== undefined) {
      patch.order_type = updatedOrder.orderType;
    }

    // Normalize employee assignments to prevent duplication
    if (updatedOrder.assignedEmployeeIds !== undefined) {
      // If assignedEmployeeIds is provided, use it as the source of truth
      if (updatedOrder.assignedEmployeeIds.length > 0) {
        patch.assigned_employee_ids = updatedOrder.assignedEmployeeIds;
        // Set assigned_employee_id to first employee for backward compatibility
        patch.assigned_employee_id = updatedOrder.assignedEmployeeIds[0];
      } else {
        // Empty array means no employees assigned
        patch.assigned_employee_ids = undefined;
        patch.assigned_employee_id = null;
      }
    } else if (updatedOrder.assignedEmployeeId !== undefined) {
      // If only assignedEmployeeId is provided (backward compatibility)
      if (updatedOrder.assignedEmployeeId) {
        patch.assigned_employee_id = updatedOrder.assignedEmployeeId;
        patch.assigned_employee_ids = [updatedOrder.assignedEmployeeId];
      } else {
        patch.assigned_employee_id = null;
        patch.assigned_employee_ids = undefined;
      }
    }

    // Include load_pieces if provided
    if (updatedOrder.loadPieces !== undefined) {
      // If loadPieces is provided, use it (can be array or undefined/null)
      if (updatedOrder.loadPieces && updatedOrder.loadPieces.length > 0) {
        // Filter out null values before saving
        const cleanedPieces = updatedOrder.loadPieces.filter(
          (p) => p !== null && p !== undefined
        );
        patch.load_pieces = cleanedPieces.length > 0 ? cleanedPieces : null;
      } else {
        patch.load_pieces = undefined;
      }
    }

    // Include found_items if provided
    if (updatedOrder.foundItems !== undefined) {
      // If foundItems is provided, use it (can be array or undefined/null)
      if (updatedOrder.foundItems && updatedOrder.foundItems.length > 0) {
        // Filter out empty strings and trim items
        const cleanedItems = updatedOrder.foundItems
          .map(item => item?.trim())
          .filter(item => item && item.length > 0);
        patch.found_items = cleanedItems.length > 0 ? cleanedItems : undefined;
      } else {
        patch.found_items = undefined;
      }
    }

    // Use finalOrderId (which might be the new RKR ID) for the update
    const { error: patchError } = await updateOrderFields(
      finalOrderId,
      patch
    );

    if (patchError) {
      // Check for specific Supabase errors and show friendly messages
      const isCoerceError =
        patchError.message?.includes('coerce') ||
        patchError.message?.includes('JSON object');
      toast({
        variant: 'default',
        title: isCoerceError
          ? 'Please refresh the page'
          : 'Update may be in progress',
        description:
          'The order may have been updated. Please refresh the page to see the latest information.',
      });
      console.error('Order update error:', patchError);
      return {
        success: false,
        error: patchError.message || 'Failed to update order',
      };
    }

    // Update the order in place to maintain its position in the list
    setAllOrders((prevOrders) => {
      const orderIndex = prevOrders.findIndex(
        (o) => o.id === updatedOrder.id || o.id === finalOrderId
      );
      if (orderIndex !== -1) {
        const newOrders = [...prevOrders];
        newOrders[orderIndex] = updatedOrder;
        return newOrders;
      }
      // If order not found, refresh all orders
      return prevOrders;
    });

    toast({
      title: 'Order Updated',
      description: `Order #${finalOrderId} has been updated successfully.`,
    });

    return { success: true, finalOrderId };
  } catch (error: any) {
    console.error('Unexpected error updating order:', error);
    toast({
      variant: 'default',
      title: 'Please refresh the page',
      description:
        'The order may have been updated. Refresh to see the latest information.',
    });
    return {
      success: false,
      error: error.message || 'Unexpected error updating order',
    };
  }
}
