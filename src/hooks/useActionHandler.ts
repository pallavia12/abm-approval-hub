import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

export interface ActionResult {
  requestId: string;
  action: 'ACCEPTED' | 'REJECTED' | 'MODIFIED' | 'ESCALATED';
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
      const response = await fetch('https://ninjasndanalytics.app.n8n.cloud/webhook/update-discount-request', {
        //'http://localhost:5678/webhook-test/update-discount-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const responseData = await response.json();
      return { success: responseData.success, data: responseData, error: responseData.success ? null : responseData.message };
    } catch (error) {
      console.error('Error sending to discount update webhook:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  };

  const calculateTAT = (createdAt: string, actionTimestamp: string): string => {
    console.log('TAT Calculation Debug:', { createdAt, actionTimestamp });
    
    const createdDate = new Date(createdAt);
    const actionDate = new Date(actionTimestamp);
    
    console.log('Parsed dates:', { 
      createdDate: createdDate.toISOString(), 
      actionDate: actionDate.toISOString(),
      createdTime: createdDate.getTime(),
      actionTime: actionDate.getTime()
    });
    
    const diffMs = actionDate.getTime() - createdDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    console.log('TAT calculation result:', { diffMs, diffHours, diffMins });
    
    return `${diffHours} hours, ${diffMins} mins`;
  };

  const executeAction = async (requestId: string, action: 'ACCEPTED' | 'REJECTED' | 'MODIFIED' | 'ESCALATED', additionalData?: any) => {
    const now = new Date();
    const timestamp = now.toISOString();
    const formattedTimestamp = format(now, 'yyyy:MM:dd HH:mm:ss');
    const username = localStorage.getItem("asgard_username") || "";
    
    // Map actions to the expected status values
    const statusMap: Record<string, string> = {
      'ACCEPTED': 'ACCEPTED',
      'REJECTED': 'REJECTED', 
      'MODIFIED': 'MODIFIED',
      'ESCALATED': 'ESCALATED',
      'Accept': 'ACCEPTED',
      'Reject': 'REJECTED',
      'Modify': 'MODIFIED',
      'Escalate': 'ESCALATED'
    };

    const payload = {
      ids: [parseInt(requestId)],
      abmStatus: statusMap[action],
      abmOrderQty: action === 'MODIFIED' ? additionalData?.orderKg || null : null,
      abmDiscountType: action === 'MODIFIED' ? additionalData?.discountType || null : null,
      abmDiscountValue: action === 'MODIFIED' ? additionalData?.discountValue || null : null,
      abmRemarks: action === 'ESCALATED' ? additionalData?.remarks || null : null,
      abmReviewedBy: username,
      abmReviewedAt: formattedTimestamp
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
        description: result.error || `Failed to ${action.toLowerCase()} request ${requestId}`,
        variant: "destructive"
      });
    }

    return result;
  };

  const executeBulkAction = async (requestIds: string[], action: 'ACCEPTED' | 'REJECTED', additionalData?: any) => {
    const now = new Date();
    const timestamp = now.toISOString();
    const formattedTimestamp = format(now, 'yyyy:MM:dd HH:mm:ss');
    const username = localStorage.getItem("asgard_username") || "";
    
    // Map actions to the expected status values
    const statusMap: Record<string, string> = {
      'ACCEPTED': 'ACCEPTED',
      'REJECTED': 'REJECTED',
      'Accept': 'ACCEPTED',
      'Reject': 'REJECTED'
    };

    const payload = {
      ids: requestIds.map(id => parseInt(id)),
      abmStatus: statusMap[action],
      abmOrderQty: null, // Bulk actions don't modify these fields
      abmDiscountType: null,
      abmDiscountValue: null,
      abmRemarks: null, // Bulk actions are not escalations
      abmReviewedBy: username,
      abmReviewedAt: formattedTimestamp
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
        description: result.error || `Failed to ${action.toLowerCase()} selected requests`,
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