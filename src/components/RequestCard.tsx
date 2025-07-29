import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ApprovalRequest {
  requestId: string;
  customerId: string;
  name: string;
  contactNumber: string;
  campaignType: string;
  skuName?: string;
  orderValue: number;
  discountValue: number;
  discountType: string;
  reason?: string;
  requestedBy: string;
  requestedByContact: string;
  eligibility: 0 | 1;
  createdAt?: string;
}

interface RequestCardProps {
  request: ApprovalRequest;
  isSelected: boolean;
  isDisabled: boolean;
  onSelectionChange: (requestId: string, checked: boolean) => void;
  onAction: (requestId: string, action: string) => void;
  actionTaken?: { action: string; timestamp: string } | null;
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
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {getActionPastTense(actionTaken.action)}
          </Badge>
          <span className="text-xs text-muted-foreground">
            {new Date(actionTaken.timestamp).toLocaleString()}
          </span>
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

    if (request.eligibility === 1) {
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
            variant={request.eligibility === 1 ? "default" : "destructive"}
            className="text-xs"
          >
            {request.eligibility === 1 ? "Eligible" : "Not Eligible"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Customer Details */}
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Customer</h4>
          <div className="font-medium">{request.name} ({request.customerId})</div>
          <div className="text-sm text-muted-foreground">{request.contactNumber}</div>
        </div>

        {/* Campaign & Order Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Campaign</h4>
            <div className="text-sm">{request.campaignType}</div>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Order</h4>
            <div className="text-sm font-medium">{request.orderValue} kg</div>
            {request.skuName && (
              <div className="text-xs text-muted-foreground">SKU: {request.skuName}</div>
            )}
          </div>
        </div>

        {/* Discount Details */}
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Discount</h4>
          <div className="text-sm">
            {request.discountValue}
            {request.discountType === "Percentage" ? "%" : " ₹"} 
            <span className="text-muted-foreground ml-1">({request.discountType})</span>
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
            <div className="text-sm">{request.requestedBy}</div>
            <div className="text-xs text-muted-foreground">{request.requestedByContact}</div>
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Requested Date</h4>
            <div className="text-sm">{new Date(request.createdAt || new Date()).toLocaleDateString()}</div>
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