import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export interface ActionResult {
  requestId: string;
  action: 'Accept' | 'Reject' | 'Modify' | 'Escalate';
  timestamp: string;
  disabled: boolean;
  tatTime?: string;
  createdAt?: string;
}

export const useActionHandler = () => {
  const [actionResults, setActionResults] = useState<Record<string, ActionResult>>({});
  const { toast } = useToast();

  const sendToDiscountUpdateWebhook = async (data: any) => {
    console.log('Sending to discount update webhook:', data);
    
    try {
      const response = await fetch('http://localhost:5678/webhook-test/update-discount-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return { success: true };
    } catch (error) {
      console.error('Error sending to discount update webhook:', error);
      return { success: false, error };
    }
  };

  const calculateTAT = (createdAt: string, actionTimestamp: string): string => {
    const createdDate = new Date(createdAt);
    const actionDate = new Date(actionTimestamp);
    
    const diffMs = actionDate.getTime() - createdDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours} hours, ${diffMins} mins`;
  };

  const executeAction = async (requestId: string, action: 'Accept' | 'Reject' | 'Modify' | 'Escalate', additionalData?: any) => {
    const timestamp = new Date().toISOString();
    const username = localStorage.getItem("asgard_username") || "";
    
    // Map actions to the expected status values
    const statusMap = {
      'Accept': 'Approve',
      'Reject': 'Reject', 
      'Modify': 'Modify',
      'Escalate': 'Escalate'
    };

    const payload = {
      ids: [parseInt(requestId)],
      abmStatus: statusMap[action],
      abmOrderQty: action === 'Modify' ? additionalData?.orderKg || null : null,
      abmDiscountType: action === 'Modify' ? additionalData?.discountType || null : null,
      abmDiscountValue: action === 'Modify' ? additionalData?.discountValue || null : null,
      abmRemarks: action === 'Escalate' ? additionalData?.remarks || null : null,
      abmReviewedBy: username,
      abmReviewedAt: timestamp
    };

    const result = await sendToDiscountUpdateWebhook(payload);
    
    if (result.success) {
      const createdAt = additionalData?.createdAt;
      const tatTime = createdAt ? calculateTAT(createdAt, timestamp) : undefined;
      
      setActionResults(prev => ({
        ...prev,
        [requestId]: {
          requestId,
          action,
          timestamp,
          disabled: true,
          tatTime,
          createdAt
        }
      }));

      toast({
        title: "Action Completed",
        description: `${action} action completed for request ${requestId}`,
      });
    } else {
      toast({
        title: "Action Failed",
        description: `Failed to ${action.toLowerCase()} request ${requestId}`,
        variant: "destructive"
      });
    }

    return result;
  };

  const executeBulkAction = async (requestIds: string[], action: 'Accept' | 'Reject', additionalData?: any) => {
    const timestamp = new Date().toISOString();
    const username = localStorage.getItem("asgard_username") || "";
    
    // Map actions to the expected status values
    const statusMap = {
      'Accept': 'Approve',
      'Reject': 'Reject'
    };

    const payload = {
      ids: requestIds.map(id => parseInt(id)),
      abmStatus: statusMap[action],
      abmOrderQty: null, // Bulk actions don't modify these fields
      abmDiscountType: null,
      abmDiscountValue: null,
      abmRemarks: null, // Bulk actions are not escalations
      abmReviewedBy: username,
      abmReviewedAt: timestamp
    };

    const result = await sendToDiscountUpdateWebhook(payload);
    
    if (result.success) {
      const newResults: Record<string, ActionResult> = {};
      requestIds.forEach(requestId => {
        const createdAt = additionalData?.createdAtMap?.[requestId];
        const tatTime = createdAt ? calculateTAT(createdAt, timestamp) : undefined;
        
        newResults[requestId] = {
          requestId,
          action,
          timestamp,
          disabled: true,
          tatTime,
          createdAt
        };
      });

      setActionResults(prev => ({
        ...prev,
        ...newResults
      }));

      toast({
        title: "Bulk Action Completed",
        description: `${action} action completed for ${requestIds.length} requests`,
      });
    } else {
      toast({
        title: "Bulk Action Failed",
        description: `Failed to ${action.toLowerCase()} selected requests`,
        variant: "destructive"
      });
    }

    return result;
  };

  const isActionDisabled = (requestId: string): boolean => {
    return actionResults[requestId]?.disabled || false;
  };

  const getActionTaken = (requestId: string): ActionResult | null => {
    return actionResults[requestId] || null;
  };

  return {
    executeAction,
    executeBulkAction,
    isActionDisabled,
    getActionTaken,
    actionResults
  };
};