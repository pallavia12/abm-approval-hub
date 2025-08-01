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
import { Pagination } from "@/components/Pagination";

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

// Mock data
const mockData: ApprovalRequest[] = [
  {
    requestId: 1,
    eligible: 1,
    customerId: 12345,
    customerName: "John Doe Enterprises",
    customerContact: 9876543210,
    campaignType: "Volume Discount",
    skuId: 100,
    orderQty: 500,
    discountValue: 15,
    discountType: "Percentage",
    reason: "Bulk order commitment",
    requestedBy: 123,
    requestedByUserName: "SalesRepA",
    requestedByContact: "9876543211",
    ABM_Id: 456,
    ABM_UserName: "ABM_User1",
    createdAt: "2024-01-15 10:30:00",
  },
  {
    requestId: 2,
    eligible: 0,
    customerId: 67890,
    customerName: "ABC Manufacturing",
    customerContact: 9876543212,
    campaignType: "New Customer",
    orderQty: 250,
    discountValue: 5000,
    discountType: "Fixed Amount",
    requestedBy: 124,
    requestedByUserName: "SalesRepB",
    requestedByContact: "9876543213",
    ABM_Id: 456,
    ABM_UserName: "ABM_User1",
    createdAt: "2024-01-14 14:15:00",
  },
];

const Dashboard = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [username, setUsername] = useState<string>("");
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const requestsPerPage = 10;
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
    
    // Fetch requests from the API
    const fetchRequests = async () => {
      try {
        const response = await fetch("http://localhost:5678/webhook-test/fetch-requests", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: asgardUsername,
          }),
        });
        
        if (response.ok) {
          const data = await response.json();
          setRequests(data);
        } else {
          console.error("Failed to fetch requests:", response.statusText);
          // Fallback to mock data if API fails
          setRequests(mockData);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
        // Fallback to mock data if API fails
        setRequests(mockData);
      }
    };
    
    fetchRequests();
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("asgard_username");
    toast({
      title: "Logged out",
      description: "You have been logged out successfully",
    });
    navigate("/");
  };

  const handleAction = async (requestId: number, action: string) => {
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

    const request = requests.find(r => r.requestId === requestId);
    await executeAction(requestId.toString(), action as 'Accept' | 'Reject', { createdAt: request?.createdAt });
  };

  const handleModifyConfirm = async (modifyData: ModifyData) => {
    if (!selectedRequest) return;

    const updatedRequests = requests.map(request => {
      if (request.requestId === selectedRequest.requestId) {
        return {
          ...request,
          ...(modifyData.orderKg !== undefined && { orderQty: modifyData.orderKg }),
          ...(modifyData.discountType !== undefined && { discountType: modifyData.discountType }),
          ...(modifyData.discountValue !== undefined && { discountValue: modifyData.discountValue }),
        };
      }
      return request;
    });

    setRequests(updatedRequests);
    await executeAction(selectedRequest.requestId.toString(), 'Modify', { ...modifyData, createdAt: selectedRequest.createdAt });
  };

  const handleEscalateConfirm = async (remarks: string) => {
    if (!selectedRequest) return;

    await executeAction(selectedRequest.requestId.toString(), 'Escalate', { remarks, createdAt: selectedRequest.createdAt });
  };

  // Bulk action handlers
  const handleSelectAll = () => {
    const eligibleRequests = paginatedRequests.filter(r => !isActionDisabled(r.requestId.toString()));
    setSelectedRequests(eligibleRequests.map(r => r.requestId));
  };

  const handleDeselectAll = () => {
    setSelectedRequests([]);
  };

  const handleBulkAccept = async () => {
    const eligibleSelected = selectedRequests.filter(id => {
      const request = requests.find(r => r.requestId === id);
      return request?.eligible === 1 && !isActionDisabled(id.toString());
    });
    
    if (eligibleSelected.length > 0) {
      const createdAtMap: Record<string, string> = {};
      eligibleSelected.forEach(id => {
        const request = requests.find(r => r.requestId === id);
        if (request?.createdAt) {
          createdAtMap[id.toString()] = request.createdAt;
        }
      });
      
      await executeBulkAction(eligibleSelected.map(id => id.toString()), 'Accept', { createdAtMap });
      setSelectedRequests([]);
    }
  };

  const handleBulkReject = async () => {
    const eligibleSelected = selectedRequests.filter(id => !isActionDisabled(id.toString()));
    
    if (eligibleSelected.length > 0) {
      const createdAtMap: Record<string, string> = {};
      eligibleSelected.forEach(id => {
        const request = requests.find(r => r.requestId === id);
        if (request?.createdAt) {
          createdAtMap[id.toString()] = request.createdAt;
        }
      });
      
      await executeBulkAction(eligibleSelected.map(id => id.toString()), 'Reject', { createdAtMap });
      setSelectedRequests([]);
    }
  };

  const handleCheckboxChange = (requestId: number, checked: boolean) => {
    if (checked) {
      setSelectedRequests(prev => [...prev, requestId]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    }
  };

  // Filter requests based on search and date filter
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      request.customerId.toString().includes(searchQuery.toLowerCase()) ||
      request.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.requestedByUserName.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (!dateFilter) return true;
    
    const requestDate = new Date(request.createdAt);
    return requestDate.toDateString() === dateFilter.toDateString();
  });

  // Calculate pagination
  const totalFilteredRequests = filteredRequests.length;
  const calculatedTotalPages = Math.ceil(totalFilteredRequests / requestsPerPage);
  
  // Update total pages when filtered requests change
  if (calculatedTotalPages !== totalPages) {
    setTotalPages(calculatedTotalPages);
    if (currentPage > calculatedTotalPages && calculatedTotalPages > 0) {
      setCurrentPage(1);
    }
  }

  // Get current page requests
  const startIndex = (currentPage - 1) * requestsPerPage;
  const endIndex = startIndex + requestsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);

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
          selectedRequests={selectedRequests.map(id => id.toString())}
          totalRequests={paginatedRequests.filter(r => !isActionDisabled(r.requestId.toString())).length}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          onBulkAccept={handleBulkAccept}
          onBulkReject={handleBulkReject}
        />

        {/* Request Cards */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Approval Requests ({totalFilteredRequests})
            </h2>
          </div>
          
          {paginatedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">No requests found matching your criteria.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {paginatedRequests.map((request) => (
                <RequestCard
                  key={request.requestId}
                  request={request}
                  isSelected={selectedRequests.includes(request.requestId)}
                  isDisabled={isActionDisabled(request.requestId.toString())}
                  onSelectionChange={handleCheckboxChange}
                  onAction={handleAction}
                  actionTaken={getActionTaken(request.requestId.toString())}
                  bulkModeActive={selectedRequests.length > 0}
                />
              ))}
            </div>
          )}

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>

        {/* Modals */}
        {selectedRequest && (
          <>
            <ModifyRequestModal
              isOpen={modifyModalOpen}
              onClose={() => setModifyModalOpen(false)}
              onConfirm={handleModifyConfirm}
              requestId={selectedRequest.requestId.toString()}
              currentData={{
                orderValue: selectedRequest.orderQty,
                discountType: selectedRequest.discountType,
                discountValue: selectedRequest.discountValue || 0,
              }}
            />
            <EscalateRequestModal
              isOpen={escalateModalOpen}
              onClose={() => setEscalateModalOpen(false)}
              onConfirm={handleEscalateConfirm}
              requestId={selectedRequest.requestId.toString()}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;