import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";

interface ApprovalRequest {
  requestId: number;
  eligible: 0 | 1;
  eligibilityReason?: string;
  customerId: number;
  customerName: string;
  customerContact: number;
  campaignType: string;
  skuId?: number;
  skuName?: string;
  orderQty: number;
  orderMode?: number;
  discountValue: number | null;
  discountType: string;
  reason?: string;
  requestedBy: number;
  requestedByUserName: string;
  requestedByContact: string;
  ABM_Id: number;
  ABM_UserName: string;
  createdAt: string;
  abmStatus?: string | null;
  abmReviewedAt?: string;
  abmOrderQty?: number;
  abmDiscountValue?: number;
  abmDiscountType?: string;
  abmRemarks?: string;
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
  // Calculate TAT if abmStatus exists and abmReviewedAt is available
  const calculateAbmTAT = () => {
    if (request.abmStatus && request.abmReviewedAt) {
      const createdAt = new Date(request.createdAt);
      const reviewedAt = new Date(request.abmReviewedAt);
      const diffInMs = reviewedAt.getTime() - createdAt.getTime();
      
      const days = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diffInMs % (1000 * 60 * 60)) / (1000 * 60));
      
      return `${days} days, ${hours} hours, ${minutes} minutes`;
    }
    return null;
  };

  const renderActionButtons = () => {
    // If abmStatus exists (not null), disable all actions
    const disabled = isDisabled || bulkModeActive || (request.abmStatus !== null && request.abmStatus !== undefined);

    // Show abmStatus information if it exists (not null or undefined)
    if (request.abmStatus && request.abmStatus !== null) {
      const abmTAT = calculateAbmTAT();
      return (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="secondary" className="text-xs">
              {request.abmStatus}
            </Badge>
            {request.abmReviewedAt && (
              <span className="text-xs text-muted-foreground">
                {request.abmReviewedAt.replace('T', ' ').slice(0, 19)}
              </span>
            )}
            {abmTAT && (
              <Badge variant="outline" className="text-xs">
                TAT: {abmTAT}
              </Badge>
            )}
          </div>
          {request.abmStatus === 'ESCALATED' && request.abmRemarks && (
            <div className="text-xs text-muted-foreground">
              <strong>Remarks:</strong> {request.abmRemarks}
            </div>
          )}
        </div>
      );
    }

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
              disabled={isDisabled || (request.abmStatus !== null && request.abmStatus !== undefined)}
            />
            <CardTitle className="text-lg">{request.requestId}</CardTitle>
          </div>
          <div className="flex flex-col items-end gap-1">
            <Badge 
              variant={request.eligible === 1 ? "default" : "destructive"}
              className="text-xs"
            >
              {request.eligible === 1 ? "Eligible" : "Not Eligible"}
            </Badge>
            {request.eligibilityReason && (
              <div className="text-xs text-muted-foreground text-right max-w-[180px] break-words">
                {request.eligibilityReason}
              </div>
            )}
          </div>
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
            {request.campaignType === 'SKU Promotion' && (request.skuId || request.skuName) && (
              <div className="text-xs text-muted-foreground mt-1">
                {request.skuId && <div>SKU ID: {request.skuId}</div>}
                {request.skuName && <div>SKU Name: {request.skuName}</div>}
              </div>
            )}
          </div>
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Order</h4>
            <div className="text-sm font-medium">
              {/* Show abmOrderQty if available and not 0, otherwise show original orderQty */}
              {request.abmStatus === 'MODIFIED' && request.abmOrderQty && request.abmOrderQty !== 0 
                ? request.abmOrderQty 
                : request.orderQty} kg
            </div>
            {request.orderMode && (
              <div className="text-xs text-muted-foreground">
                {request.orderMode === 1 ? 'Delivery' : request.orderMode === 2 ? 'Pickup' : `Mode: ${request.orderMode}`}
              </div>
            )}
          </div>
        </div>

        {/* Discount Details */}
        <div>
          <h4 className="font-medium text-sm text-muted-foreground mb-1">Discount</h4>
          <div className="text-sm">
            {/* Show abm values if modified and available, otherwise show original */}
            {request.abmStatus === 'MODIFIED' && request.abmDiscountValue && request.abmDiscountValue !== 0
              ? request.abmDiscountValue
              : (request.discountValue || 0)} 
            {' '}
            ({request.abmStatus === 'MODIFIED' && request.abmDiscountType && request.abmDiscountType.trim() !== ''
              ? request.abmDiscountType
              : request.discountType})
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
            <div className="text-sm">{new Date(request.createdAt).toISOString().slice(0, 19).replace('T', ' ')}</div>
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