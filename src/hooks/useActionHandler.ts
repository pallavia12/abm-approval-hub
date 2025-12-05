import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

// API Configuration - matches Dashboard.tsx
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || "https://ninjasndanalytics.app.n8n.cloud";
};

const getApiUrl = (endpoint: string) => {
  return `${getApiBaseUrl()}/webhook/${endpoint}`;
};

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
  const [loadingRequests, setLoadingRequests] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  const sendToDiscountUpdateWebhook = async (data: any) => {
    console.log('Sending to discount update webhook:', data);
    
    try {
      const response = await fetch(getApiUrl('update-discount-request'), {
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
    // Convert both timestamps to UTC for consistent comparison
    const createdDate = new Date(createdAt);
    // The actionTimestamp from webhook is in format "2025:09:09 13:50:17"
    // We need to normalize the format for proper parsing
    const normalizedActionTimestamp = actionTimestamp.replace(/:/g, '-').replace(' ', 'T') + '.000Z';
    const actionDate = new Date(normalizedActionTimestamp);
    
    const diffMs = Math.abs(actionDate.getTime() - createdDate.getTime());
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    // Format TAT display intelligently
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''}, ${diffHours} hour${diffHours !== 1 ? 's' : ''}`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''}, ${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    } else {
      return `${diffMins} min${diffMins !== 1 ? 's' : ''}`;
    }
  };

  const executeAction = async (requestId: string, action: 'ACCEPTED' | 'REJECTED' | 'MODIFIED' | 'ESCALATED', additionalData?: any) => {
    setLoadingRequests(prev => new Set(prev).add(requestId));
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
      abmDiscountType: action === 'MODIFIED' ? (additionalData?.discountType !== undefined ? additionalData.discountType : null) : null,
      abmDiscountValue: action === 'MODIFIED' ? additionalData?.discountValue || null : null,
      abmRemarks: action === 'ESCALATED' || action === 'REJECTED' ? additionalData?.remarks || null : null,
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

    setLoadingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(requestId);
      return newSet;
    });
    return result;
  };

  const executeBulkAction = async (requestIds: string[], action: 'ACCEPTED' | 'REJECTED', additionalData?: any) => {
    requestIds.forEach(id => setLoadingRequests(prev => new Set(prev).add(id)));
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

    requestIds.forEach(id => setLoadingRequests(prev => {
      const newSet = new Set(prev);
      newSet.delete(id);
      return newSet;
    }));
    return result;
  };

  const isActionDisabled = (requestId: string): boolean => {
    return actionResults[requestId]?.disabled || loadingRequests.has(requestId) || false;
  };

  const isRequestLoading = (requestId: string): boolean => {
    return loadingRequests.has(requestId);
  };

  const getActionTaken = (requestId: string): ActionResult | null => {
    return actionResults[requestId] || null;
  };

  return {
    executeAction,
    executeBulkAction,
    isActionDisabled,
    getActionTaken,
    actionResults,
    isRequestLoading,
    isBulkLoading: loadingRequests.size > 0
  };
};