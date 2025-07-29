import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";
import ModifyRequestModal, { ModifyData } from "@/components/ModifyRequestModal";
import EscalateRequestModal from "@/components/EscalateRequestModal";
import { BulkActionBar } from "@/components/BulkActionBar";
import { useActionHandler } from "@/hooks/useActionHandler";
import { RequestCard } from "@/components/RequestCard";
import { SearchAndFilters } from "@/components/SearchAndFilters";

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
    createdAt: "2024-01-15",
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
    createdAt: "2024-01-14",
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
    createdAt: "2024-01-13",
  },
];

const Dashboard = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [username, setUsername] = useState<string>("");
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<string>("all");
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

  // Filter requests based on search and date filter
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.customerId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (dateFilter === "all") return true;
    
    const requestDate = new Date(request.createdAt || "2024-01-15");
    const today = new Date();
    
    switch (dateFilter) {
      case "today":
        return requestDate.toDateString() === today.toDateString();
      case "week":
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        return requestDate >= weekAgo;
      case "month":
        const monthAgo = new Date(today);
        monthAgo.setMonth(today.getMonth() - 1);
        return requestDate >= monthAgo;
      default:
        return true;
    }
  });

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

        {/* Search and Filters */}
        <SearchAndFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          dateFilter={dateFilter}
          onDateFilterChange={setDateFilter}
        />

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedRequests={selectedRequests}
          totalRequests={filteredRequests.filter(r => !isActionDisabled(r.requestId)).length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkAccept={handleBulkAccept}
          onBulkReject={handleBulkReject}
        />

        {/* Request Cards */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Approval Requests ({filteredRequests.length})
            </h2>
          </div>
          
          {filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No requests found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {filteredRequests.map((request) => (
                <RequestCard
                  key={request.requestId}
                  request={request}
                  isSelected={selectedRequests.includes(request.requestId)}
                  isDisabled={isActionDisabled(request.requestId)}
                  onSelectionChange={handleCheckboxChange}
                  onAction={handleAction}
                  actionTaken={getActionTaken(request.requestId)}
                  bulkModeActive={selectedRequests.length > 0}
                />
              ))}
            </div>
          )}
        </div>

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