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

  const sendToN8n = async (data: any) => {
    // Placeholder for n8n integration - will be updated with actual URL
    console.log('Sending to n8n:', data);
    
    try {
      // TODO: Replace with actual n8n URL
      // const response = await fetch('N8N_WEBHOOK_URL', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(data)
      // });
      
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 500));
      return { success: true };
    } catch (error) {
      console.error('Error sending to n8n:', error);
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
    
    const actionData = {
      requestId,
      action,
      timestamp,
      ...additionalData
    };

    const result = await sendToN8n(actionData);
    
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
    
    const bulkData = {
      requestIds,
      action,
      timestamp,
      bulkAction: true,
      ...additionalData
    };

    const result = await sendToN8n(bulkData);
    
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