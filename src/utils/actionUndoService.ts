/**
 * Granular Specific Action Undo & Reversal Engine
 * Allows undoing a specific operation (e.g. erroneous fee collection, accidental marks entry)
 * without rolling back or impacting other work done afterwards.
 */

import { ActionLogEntry, ReversibleActionType, ERPModule } from '../types';
import { get, putItem, remove, getAll, add } from '../db/indexedDB';

// 1. Record an action for potential granular undo
export async function recordReversibleAction(
  action: Omit<ActionLogEntry, 'id' | 'timestamp' | 'canUndo' | 'isUndone'>
): Promise<ActionLogEntry> {
  const entry: ActionLogEntry = {
    ...action,
    id: `act_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
    timestamp: new Date().toISOString(),
    canUndo: true,
    isUndone: false,
  };

  try {
    await putItem('actionLogs', entry);
  } catch (err) {
    console.warn('Could not save to actionLogs IndexedDB store, saving to fallback:', err);
    try {
      const stored = JSON.parse(localStorage.getItem('erp_action_logs') || '[]');
      stored.unshift(entry);
      localStorage.setItem('erp_action_logs', JSON.stringify(stored.slice(0, 100)));
    } catch (e) {}
  }

  return entry;
}

// 2. Fetch action logs with optional filtering
export async function getActionLogs(filter?: {
  module?: string;
  actionType?: string;
  search?: string;
  isUndone?: boolean;
}): Promise<ActionLogEntry[]> {
  let list: ActionLogEntry[] = [];

  try {
    list = await getAll<ActionLogEntry>('actionLogs');
  } catch (err) {
    try {
      list = JSON.parse(localStorage.getItem('erp_action_logs') || '[]');
    } catch (e) {}
  }

  // Sort descending by timestamp
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  if (!filter) return list;

  return list.filter((item) => {
    if (filter.module && filter.module !== 'all' && item.module !== filter.module) {
      return false;
    }
    if (filter.actionType && filter.actionType !== 'all' && item.actionType !== filter.actionType) {
      return false;
    }
    if (filter.isUndone !== undefined && item.isUndone !== filter.isUndone) {
      return false;
    }
    if (filter.search) {
      const q = filter.search.toLowerCase();
      const match =
        item.title.toLowerCase().includes(q) ||
        item.bengaliTitle.toLowerCase().includes(q) ||
        item.details.toLowerCase().includes(q) ||
        (item.targetIdentifier && item.targetIdentifier.toLowerCase().includes(q)) ||
        item.username.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });
}

// 3. Execute granular undo for a specific action
export async function executeGranularUndo(
  actionId: string,
  reason: string,
  currentUser?: { id: string; username: string }
): Promise<{ success: boolean; message: string; bengaliMessage: string }> {
  // Fetch action
  let action: ActionLogEntry | null = null;
  try {
    action = await get<ActionLogEntry>('actionLogs', actionId);
  } catch (e) {}

  if (!action) {
    const list: ActionLogEntry[] = JSON.parse(localStorage.getItem('erp_action_logs') || '[]');
    action = list.find((a) => a.id === actionId) || null;
  }

  if (!action) {
    throw new Error('Action record not found.');
  }

  if (action.isUndone) {
    throw new Error('This action has already been reversed.');
  }

  const { reversalData, actionType } = action;

  // Execute specific compensation based on action type
  if (actionType === 'FEE_PAYMENT' && reversalData.feeMeta) {
    const { feeChargeId, paymentId, receiptId, amountReversed, previousPaidAmount, previousDueAmount, previousPaymentStatus } =
      reversalData.feeMeta;

    // 1. Revert the invoice (feeCharges) balance
    if (feeChargeId) {
      const invoice = await get<any>('feeCharges', feeChargeId);
      if (invoice) {
        invoice.paidAmount = previousPaidAmount !== undefined ? previousPaidAmount : Math.max(0, (invoice.paidAmount || 0) - amountReversed);
        invoice.dueAmount = previousDueAmount !== undefined ? previousDueAmount : (invoice.totalAmount || 0) - invoice.paidAmount;
        invoice.status = previousPaymentStatus || (invoice.paidAmount === 0 ? 'unpaid' : 'partial');
        invoice.updatedAt = new Date().toISOString();
        invoice.reversalNote = `Undone fee payment of ৳${amountReversed} on ${new Date().toLocaleDateString()}: ${reason}`;
        await putItem('feeCharges', invoice);
      }
    }

    // 2. Cancel or remove the specific payment record
    if (paymentId) {
      try {
        const payment = await get<any>('payments', paymentId);
        if (payment) {
          payment.status = 'cancelled';
          payment.reversalReason = reason;
          payment.reversedAt = new Date().toISOString();
          payment.reversedBy = currentUser?.username || 'admin';
          await putItem('payments', payment);
        }
      } catch (e) {
        await remove('payments', paymentId);
      }
    }

    // 3. Mark receipt as cancelled if exists
    if (receiptId) {
      try {
        const receipt = await get<any>('receipts', receiptId);
        if (receipt) {
          receipt.status = 'cancelled';
          receipt.cancelledAt = new Date().toISOString();
          receipt.cancellationReason = reason;
          await putItem('receipts', receipt);
        }
      } catch (e) {}
    }
  } else if (actionType === 'STUDENT_CREATE' || (action.reversalData.previousState === null && action.targetId)) {
    // Was a newly created record: Reversal simply removes that single created record
    await remove(action.targetStore as any, action.targetId);
  } else if (action.reversalData.previousState) {
    // Was an edit / update: Reversal restores the exact previous state for this single entity
    await putItem(action.targetStore as any, action.reversalData.previousState);
  } else if (action.reversalData.currentState && !action.reversalData.previousState) {
    // Was a delete: Reversal re-inserts the entity back into its store
    await putItem(action.targetStore as any, action.reversalData.currentState);
  }

  // Mark action log as undone
  action.isUndone = true;
  action.undoneAt = new Date().toISOString();
  action.undoneBy = currentUser?.username || 'Admin';
  action.undoneReason = reason;

  try {
    await putItem('actionLogs', action);
  } catch (e) {
    try {
      const list: ActionLogEntry[] = JSON.parse(localStorage.getItem('erp_action_logs') || '[]');
      const idx = list.findIndex((a) => a.id === action.id);
      if (idx !== -1) {
        list[idx] = action;
        localStorage.setItem('erp_action_logs', JSON.stringify(list));
      }
    } catch (err) {}
  }

  // Record into general audit logs as well
  try {
    await add('auditLogs', {
      id: `audit_${Date.now()}`,
      userId: currentUser?.id || 'admin',
      username: currentUser?.username || 'Admin',
      action: 'SPECIFIC_ACTION_UNDONE',
      module: action.module,
      details: `Reversed specific action [${action.title}]. Reason: ${reason}. All other operations preserved.`,
      timestamp: new Date().toISOString(),
      instituteId: action.instituteId || 'both',
    });
  } catch (e) {}

  return {
    success: true,
    message: `Action "${action.title}" was successfully reversed. Subsequent records remain completely intact.`,
    bengaliMessage: `নির্দিষ্ট কাজ "${action.bengaliTitle || action.title}" সফলভাবে বাতিল (Undo) করা হয়েছে। পরবর্তীতে করা অন্যান্য সকল ডাটা অক্ষুণ্ণ রয়েছে।`,
  };
}
