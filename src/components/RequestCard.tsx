import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ApprovalRequest {
  requestId: number;
  eligible: 0 | 1;
  customerId: number;
  customerName: string;
  customerContact: number;
  campaignType: string;
  skuId?: number;
  orderQty: number;
  discountValue: number | null;
  discountType: string;
  reason?: string;
  requestedBy: number;
  requestedByUserName: string;
  requestedByContact: string;
  ABM_Id: number;
  ABM_UserName: string;
  createdAt: string;
}

interface RequestCardProps {
  request: ApprovalRequest;
  isSelected: boolean;
  isDisabled: boolean;
  onSelectionChange: (requestId: number, checked: boolean) => void;
  onAction: (requestId: number, action: string) => void;
  actionTaken?: { action: string; timestamp: string; tatTime?: string } | null;
  bulkModeActive: boolean;
}

export const RequestCard = ({
  request,
  isSelected,
  isDisabled,
  onSelectionChange,
  onAction,
  actionTaken,
  bulkModeActive,
}: RequestCardProps) => {
  const renderActionButtons = () => {
    const disabled = isDisabled || bulkModeActive;

    if (actionTaken) {
      const getActionPastTense = (action: string) => {
        switch (action) {
          case 'Accept': return 'Accepted';
          case 'Reject': return 'Rejected';
          case 'Modify': return 'Modified';
          case 'Escalate': return 'Escalated';
          default: return `${action}ed`;
        }
      };

      return (
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="secondary" className="text-xs">
            {getActionPastTense(actionTaken.action)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(actionTaken.timestamp).toLocaleString()}
          </span>
          {actionTaken.tatTime && (
            <Badge variant="outline" className="text-xs">
              TAT: {actionTaken.tatTime}
            </Badge>
          )}
        </div>
      );
    }

    const commonButtons = (
      <>
        <Button 
          variant="destructive" 
          size="sm"
          disabled={disabled}
          onClick={() => onAction(request.requestId, "Reject")}
        >
          Reject
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          disabled={disabled}
          onClick={() => onAction(request.requestId, "Modify")}
        >
          Modify
        </Button>
      </>
    );

    if (request.eligible === 1) {
      return (
        <div className="flex gap-2">
          <Button 
            variant="default" 
            size="sm"
            disabled={disabled}
            onClick={() => onAction(request.requestId, "Accept")}
          >
            Accept
          </Button>
          {commonButtons}
        </div>
      );
    } else {
      return (
        <div className="flex gap-2">
          <Button 
            variant="secondary" 
            size="sm"
            disabled={disabled}
            onClick={() => onAction(request.requestId, "Escalate")}
          >
            Escalate
          </Button>
          {commonButtons}
        </div>
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <Checkbox
              checked={isSelected}
              onCheckedChange={(checked) => 
                onSelectionChange(request.requestId, checked as boolean)
              }
              disabled={isDisabled}
            />
            <CardTitle className="text-lg">{request.requestId}</CardTitle>
          </div>
          <Badge 
            variant={request.eligible === 1 ? "default" : "destructive"}
            className="text-xs"
          >
            {request.eligible === 1 ? "Eligible" : "Not Eligible"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Details */}
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Customer</h4>
          <div className="font-medium">{request.customerName} ({request.customerId})</div>
          <div className="text-sm text-muted-foreground">{request.customerContact}</div>
        </div>

        {/* Campaign & Order Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Campaign</h4>
            <div className="text-sm">{request.campaignType}</div>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Order</h4>
            <div className="text-sm font-medium">{request.orderQty} kg</div>
            {request.skuId && (
              <div className="text-xs text-muted-foreground">SKU ID: {request.skuId}</div>
            )}
          </div>
        </div>

        {/* Discount Details */}
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Discount</h4>
          <div className="text-sm">
            {request.discountValue || 0} ({request.discountType})
          </div>
        </div>

        {/* Reason */}
        {request.reason && (
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Reason</h4>
            <div className="text-sm">{request.reason}</div>
          </div>
        )}

        {/* Requested By and Date */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Requested By</h4>
            <div className="text-sm">{request.requestedByUserName}</div>
            <div className="text-xs text-muted-foreground">{request.requestedByContact}</div>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Requested Date</h4>
            <div className="text-sm">{request.createdAt}</div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="pt-2 border-t">
          {renderActionButtons()}
        </div>
      </CardContent>
    </Card>
  );
};