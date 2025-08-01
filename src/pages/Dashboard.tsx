import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Loader2 } from "lucide-react";
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

// API Configuration
const getApiUrl = () => {
  // Use the actual webhook URL you specified
  return import.meta.env.VITE_API_URL || "http://localhost:5678/webhook-test/fetch-requests";
};

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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
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
      console.log(`[Dashboard.tsx:72] Starting fetch request for user: ${asgardUsername}`);
      setIsLoading(true);
      setError(null);
      
      try {
        console.log(`[Dashboard.tsx:77] Making POST request to webhook endpoint`);
        const response = await fetch(`http://localhost:5678/webhook-test/fetch-requests`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: asgardUsername,
          }),
        });
        
        console.log(`[Dashboard.tsx:87] Received response with status: ${response.status} ${response.statusText}`);
        
        if (!response.ok) {
          const errorMessage = `HTTP ${response.status}: ${response.statusText}`;
          console.error(`[Dashboard.tsx:90] Request failed - ${errorMessage}`);
          throw new Error(errorMessage);
        }
        
        // Get response as text first
        let responseText: string;
        try {
          console.log(`[Dashboard.tsx:98] Getting response as text`);
          responseText = await response.text();
          console.log(`[Dashboard.tsx:100] Raw response text:`, responseText);
        } catch (textError) {
          console.error(`[Dashboard.tsx:102] Failed to get response text:`, textError);
          throw new Error(`Failed to read server response: ${textError instanceof Error ? textError.message : 'Unknown error'}`);
        }

        // Parse the text as JSON
        let data;
        try {
          console.log(`[Dashboard.tsx:109] Attempting to parse JSON from response text`);
          data = JSON.parse(responseText);
          console.log(`[Dashboard.tsx:111] Successfully parsed JSON data:`, data);
        } catch (jsonError) {
          console.error(`[Dashboard.tsx:113] JSON parsing failed:`, {
            error: jsonError,
            message: jsonError instanceof Error ? jsonError.message : 'Unknown JSON parsing error',
            responseStatus: response.status,
            responseHeaders: Object.fromEntries(response.headers.entries()),
            rawResponseText: responseText
          });
          throw new Error(`Failed to parse server response as JSON: ${jsonError instanceof Error ? jsonError.message : 'Unknown error'}. Raw response: "${responseText}"`);
        }
        
        // Store debug data
        setDebugData(data);
        
        // Handle single JSON response format - expecting direct array of requests
        let processedRequests: ApprovalRequest[] = [];
        if (Array.isArray(data)) {
          processedRequests = data;
        } else {
          console.error("Expected array of requests, received:", typeof data, data);
          throw new Error("Invalid response format: expected array of approval requests");
        }
        
        console.log(`[Dashboard.tsx:139] Successfully processed ${processedRequests.length} requests from API response`);
        setRequests(processedRequests);
        setError(null);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`[Dashboard.tsx:143] Failed to fetch approval requests:`, {
          error: error,
          message: errorMessage,
          timestamp: new Date().toISOString(),
          username: asgardUsername
        });
        setError(errorMessage);
        toast({
            title: "Failed to fetch data",
            description: `Unable to load approval requests: ${errorMessage}`,
            variant: "destructive"
          });
        
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchRequests();
  }, [navigate, toast]);

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
      (request.customerId?.toString() || '').includes(searchQuery.toLowerCase()) ||
      (request.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.requestedByUserName || '').toLowerCase().includes(searchQuery.toLowerCase());

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

        {/* Debug Section */}
        {showDebug && debugData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Debug Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-muted p-4 rounded-md overflow-auto max-h-60">
                <pre className="text-sm">
                  {JSON.stringify(debugData, null, 2)}
                </pre>
              </div>
            </CardContent>
          </Card>
        )}

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
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebug(!showDebug)}
              >
                {showDebug ? "Hide" : "Show"} Debug
              </Button>
            </div>
          </div>
          
          {isLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading approval requests...</p>
              </CardContent>
            </Card>
          ) : error ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="text-destructive mb-4">
                  <p className="font-medium">Failed to load requests</p>
                  <p className="text-sm mt-2">{error}</p>
                </div>
                <Button 
                  onClick={() => window.location.reload()} 
                  variant="outline"
                >
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : paginatedRequests.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {requests.length === 0 
                    ? "No approval requests available." 
                    : "No requests found matching your criteria."
                  }
                </p>
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
          {!isLoading && !error && (
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          )}
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