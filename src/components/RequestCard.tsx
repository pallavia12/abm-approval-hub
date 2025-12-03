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
  CustomerTypeName?: string;
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
  // Overall status and admin review fields from API
  status?: string | null;
  adminStatus?: string | null;
  adminRemarks?: string | null;
  adminDiscountValue?: number | null;
  adminDiscountType?: string | null;
}

interface RequestCardProps {
  request: ApprovalRequest;
  isSelected: boolean;
  isDisabled: boolean;
  onSelectionChange: (requestId: number, checked: boolean) => void;
  onAction: (requestId: number, action: string) => void;
  actionTaken?: { action: string; timestamp: string; tatTime?: string } | null;
  bulkModeActive: boolean;
  isLoading?: boolean;
}

export const RequestCard = ({
  request,
  isSelected,
  isDisabled,
  onSelectionChange,
  onAction,
  actionTaken,
  bulkModeActive,
  isLoading = false,
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

  const getStatusVariant = (status?: string | null) => {
    const s = (status || '').toUpperCase();
    if (s === 'ACCEPTED' || s === 'APPROVED') return 'default';
    if (s === 'REJECTED') return 'destructive';
    if (s === 'MODIFIED') return 'secondary';
    if (s === 'ESCALATED' || s === 'PENDING' || s === 'CREATED') return 'outline';
    return 'secondary';
  };

  const getStatusClassName = (status?: string | null) => {
    const s = (status || '').toUpperCase();
    if (s === 'CREATED') return 'bg-green-500 text-white';
    if (s === 'PENDING') return 'bg-amber-500 text-black';
    return '';
  };

  const renderActionButtons = () => {
    // If abmStatus exists (not null), disable all actions
    const disabled = isDisabled || bulkModeActive || isLoading || (request.abmStatus !== null && request.abmStatus !== undefined);

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
          default: return `${action}`;
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
      // Eligible cases: Show Accept, Reject, Modify
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
      // Not eligible cases: Check eligibilityReason
      const eligibilityReasonLower = (request.eligibilityReason || '').toLowerCase();
      const isSkuPromotionAdminApproval = eligibilityReasonLower === 'sku promotion needs admin approval';
      
      if (isSkuPromotionAdminApproval) {
        // Show Escalate, Reject, Modify
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
      } else {
        // Disable all action buttons for other eligibility reasons
        return (
          <div className="flex gap-2">
            <Button 
              variant="default" 
              size="sm"
              disabled={true}
            >
              Accept
            </Button>
            <Button 
              variant="destructive" 
              size="sm"
              disabled={true}
            >
              Reject
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              disabled={true}
            >
              Modify
            </Button>
          </div>
        );
      }
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
              disabled={isDisabled || isLoading || (request.abmStatus !== null && request.abmStatus !== undefined)}
            />
            <CardTitle className="text-lg flex items-center gap-2">
              {request.requestId}
              {request.status && (
                <Badge variant={getStatusVariant(request.status)} className={`text-xs ${getStatusClassName(request.status)}`}>
                  {request.status}
                </Badge>
              )}
            </CardTitle>
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
          <div className="text-sm text-muted-foreground">
            {request.customerContact}
            {request.CustomerTypeName && ` • ${request.CustomerTypeName}`}
          </div>
        </div>

        {/* Campaign & Order Info */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Campaign</h4>
            <div className="text-sm">{request.campaignType}</div>
            {request.campaignType.toLowerCase().includes('sku promotion') && (request.skuId || request.skuName) && (
              <div className="text-xs text-muted-foreground mt-1">
                {request.skuId && request.skuId !== 0 && <div>SKU ID: {request.skuId}</div>}
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
              ? `₹ ${request.abmDiscountValue}`
              : `₹ ${request.discountValue || 0}`} 
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
            <div className="text-sm">{(() => {
              const date = new Date(request.createdAt);
              const day = date.getUTCDate().toString().padStart(2, '0');
              const month = (date.getUTCMonth() + 1).toString().padStart(2, '0');
              const year = date.getUTCFullYear();
              let hours = date.getUTCHours();
              const minutes = date.getUTCMinutes().toString().padStart(2, '0');
              const seconds = date.getUTCSeconds().toString().padStart(2, '0');
              const ampm = hours >= 12 ? 'PM' : 'AM';
              hours = hours % 12;
              hours = hours ? hours : 12;
              const formattedHours = hours.toString().padStart(2, '0');
              return `${day}/${month}/${year} ${formattedHours}:${minutes}:${seconds} ${ampm}`;
            })()}</div>
          </div>
        </div>

        {/* Admin Review */}
        {request.adminStatus && (
          <div className="pt-2 border-t">
            <h4 className="font-medium text-sm text-muted-foreground mb-1">Admin Review</h4>
            <div className="text-sm flex flex-col gap-1">
              <div>
                <span className="text-muted-foreground text-xs mr-2">adminStatus:</span>
                <span className="font-medium">{request.adminStatus}</span>
              </div>

              {request.adminStatus === 'REJECTED' && request.adminRemarks && (
                <div>
                  <span className="text-muted-foreground text-xs mr-2">adminRemarks:</span>
                  <span className="text-sm">{request.adminRemarks}</span>
                </div>
              )}

              {request.adminStatus === 'MODIFIED' && (request.adminDiscountValue !== null && request.adminDiscountValue !== undefined) && (
                <div>
                  <span className="text-muted-foreground text-xs mr-2">adminDiscount:</span>
                  <span className="text-sm font-medium">
                    ₹ {request.adminDiscountValue}
                    {request.adminDiscountType ? ` (${request.adminDiscountType})` : ''}
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="pt-2 border-t">
          {renderActionButtons()}
        </div>
      </CardContent>
    </Card>
  );
};