import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import ModifyRequestModal, { ModifyData } from "@/components/ModifyRequestModal";
import EscalateRequestModal from "@/components/EscalateRequestModal";
import { BulkActionBar } from "@/components/BulkActionBar";
import { useActionHandler } from "@/hooks/useActionHandler";

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
}

// Mock data
const mockData: ApprovalRequest[] = [
  {
    requestId: "REQ-001",
    customerId: "CUST-12345",
    name: "John Doe Enterprises",
    contactNumber: "+91-9876543210",
    campaignType: "Volume Discount",
    skuName: "Premium Widget A",
    orderValue: 500,
    discountValue: 15,
    discountType: "Percentage",
    reason: "Bulk order commitment",
    requestedBy: "Sales Rep A",
    requestedByContact: "+91-9876543211",
    eligibility: 1,
  },
  {
    requestId: "REQ-002",
    customerId: "CUST-67890",
    name: "ABC Manufacturing",
    contactNumber: "+91-9876543212",
    campaignType: "New Customer",
    orderValue: 250,
    discountValue: 5000,
    discountType: "Fixed Amount",
    requestedBy: "Sales Rep B",
    requestedByContact: "+91-9876543213",
    eligibility: 0,
  },
  {
    requestId: "REQ-003",
    customerId: "CUST-11111",
    name: "XYZ Corporation",
    contactNumber: "+91-9876543214",
    campaignType: "Loyalty Discount",
    skuName: "Standard Widget B",
    orderValue: 750,
    discountValue: 20,
    discountType: "Percentage",
    reason: "Long-term partnership",
    requestedBy: "Sales Rep C",
    requestedByContact: "+91-9876543215",
    eligibility: 1,
  },
];

const Dashboard = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [username, setUsername] = useState<string>("");
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { executeAction, executeBulkAction, isActionDisabled, getActionTaken } = useActionHandler();

  useEffect(() => {
    const asgardUsername = localStorage.getItem("asgard_username");
    if (!asgardUsername) {
      navigate("/");
      return;
    }
    setUsername(asgardUsername);
    setRequests(mockData);
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("asgard_username");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/");
  };

  const handleAction = async (requestId: string, action: string) => {
    if (action === "Modify") {
      const request = requests.find(r => r.requestId === requestId);
      if (request) {
        setSelectedRequest(request);
        setModifyModalOpen(true);
      }
      return;
    }
    
    if (action === "Escalate") {
      const request = requests.find(r => r.requestId === requestId);
      if (request) {
        setSelectedRequest(request);
        setEscalateModalOpen(true);
      }
      return;
    }

    await executeAction(requestId, action as 'Accept' | 'Reject');
  };

  const handleModifyConfirm = async (modifyData: ModifyData) => {
    if (!selectedRequest) return;

    const updatedRequests = requests.map(request => {
      if (request.requestId === selectedRequest.requestId) {
        return {
          ...request,
          ...(modifyData.orderKg !== undefined && { orderValue: modifyData.orderKg }),
          ...(modifyData.discountType !== undefined && { discountType: modifyData.discountType }),
          ...(modifyData.discountValue !== undefined && { discountValue: modifyData.discountValue }),
        };
      }
      return request;
    });

    setRequests(updatedRequests);
    await executeAction(selectedRequest.requestId, 'Modify', modifyData);
  };

  const handleEscalateConfirm = async (remarks: string) => {
    if (!selectedRequest) return;

    await executeAction(selectedRequest.requestId, 'Escalate', { remarks });
  };

  // Bulk action handlers
  const handleSelectAll = () => {
    const eligibleRequests = requests.filter(r => !isActionDisabled(r.requestId));
    setSelectedRequests(eligibleRequests.map(r => r.requestId));
  };

  const handleDeselectAll = () => {
    setSelectedRequests([]);
  };

  const handleBulkAccept = async () => {
    const eligibleSelected = selectedRequests.filter(id => {
      const request = requests.find(r => r.requestId === id);
      return request?.eligibility === 1 && !isActionDisabled(id);
    });
    
    if (eligibleSelected.length > 0) {
      await executeBulkAction(eligibleSelected, 'Accept');
      setSelectedRequests([]);
    }
  };

  const handleBulkReject = async () => {
    const eligibleSelected = selectedRequests.filter(id => !isActionDisabled(id));
    
    if (eligibleSelected.length > 0) {
      await executeBulkAction(eligibleSelected, 'Reject');
      setSelectedRequests([]);
    }
  };

  const handleCheckboxChange = (requestId: string, checked: boolean) => {
    if (checked) {
      setSelectedRequests(prev => [...prev, requestId]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    }
  };

  const renderActionButtons = (request: ApprovalRequest) => {
    const actionTaken = getActionTaken(request.requestId);
    const disabled = isActionDisabled(request.requestId) || selectedRequests.length > 0;

    if (actionTaken) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {actionTaken.action}ed
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
          onClick={() => handleAction(request.requestId, "Reject")}
        >
          Reject
        </Button>
        <Button 
          variant="outline" 
          size="sm"
          disabled={disabled}
          onClick={() => handleAction(request.requestId, "Modify")}
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
            onClick={() => handleAction(request.requestId, "Accept")}
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
            onClick={() => handleAction(request.requestId, "Escalate")}
          >
            Escalate
          </Button>
          {commonButtons}
        </div>
      );
    }
  };

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">ABM Approval Portal</h1>
            <p className="text-muted-foreground">Welcome, {username}</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedRequests={selectedRequests}
          totalRequests={requests.filter(r => !isActionDisabled(r.requestId)).length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkAccept={handleBulkAccept}
          onBulkReject={handleBulkReject}
        />

        {/* Requests Table */}
        <Card>
          <CardHeader>
            <CardTitle>Pending Approval Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">Select</TableHead>
                    <TableHead className="min-w-[100px]">Request ID</TableHead>
                    <TableHead className="min-w-[200px]">Customer Details</TableHead>
                    <TableHead className="min-w-[120px]">Campaign Type</TableHead>
                    <TableHead className="min-w-[120px]">Order Info</TableHead>
                    <TableHead className="min-w-[140px]">Discount Details</TableHead>
                    <TableHead className="min-w-[180px]">Reason</TableHead>
                    <TableHead className="min-w-[150px]">Requested By</TableHead>
                    <TableHead className="min-w-[100px]">Eligibility</TableHead>
                    <TableHead className="min-w-[200px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.requestId}>
                      <TableCell>
                        <Checkbox
                          checked={selectedRequests.includes(request.requestId)}
                          onCheckedChange={(checked) => 
                            handleCheckboxChange(request.requestId, checked as boolean)
                          }
                          disabled={isActionDisabled(request.requestId)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">
                        {request.requestId}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {request.name} ({request.customerId})
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {request.contactNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{request.campaignType}</div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{request.orderValue} kg</div>
                          {request.skuName && (
                            <div className="text-sm text-muted-foreground">
                              SKU: {request.skuName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>
                            {request.discountValue}
                            {request.discountType === "Percentage" ? "%" : " ₹"}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Type: {request.discountType}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {request.reason || "No reason specified"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{request.requestedBy}</div>
                          <div className="text-sm text-muted-foreground">
                            {request.requestedByContact}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                          request.eligibility === 1 
                            ? "bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400" 
                            : "bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400"
                        }`}>
                          {request.eligibility === 1 ? "Eligible" : "Not Eligible"}
                        </div>
                      </TableCell>
                      <TableCell>
                        {renderActionButtons(request)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        {/* Modals */}
        {selectedRequest && (
          <>
            <ModifyRequestModal
              isOpen={modifyModalOpen}
              onClose={() => setModifyModalOpen(false)}
              onConfirm={handleModifyConfirm}
              requestId={selectedRequest.requestId}
              currentData={{
                orderValue: selectedRequest.orderValue,
                discountType: selectedRequest.discountType,
                discountValue: selectedRequest.discountValue,
              }}
            />
            <EscalateRequestModal
              isOpen={escalateModalOpen}
              onClose={() => setEscalateModalOpen(false)}
              onConfirm={handleEscalateConfirm}
              requestId={selectedRequest.requestId}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;