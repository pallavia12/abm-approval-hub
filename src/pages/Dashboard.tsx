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
  abmStatus?: string | null;
  abmReveiwedAt?: string;
  abmOrderQty?: number;
  abmDiscountValue?: number;
  abmDiscountType?: string;
  abmRemarks?: string;
}

interface Reportee {
  SE_Id: number;
  SE_UserName: string;
  ABM_Id: number;
  ABM_UserName: string;
}

// API Configuration
const getApiUrl = () => {
  // Use the actual webhook URL you specified
  return import.meta.env.VITE_API_URL || "http://localhost:5678/webhook-test/fetch-requests";
};

const Dashboard = () => {
  const [requests, setRequests] = useState<ApprovalRequest[]>([]);
  const [reportees, setReportees] = useState<Reportee[]>([]);
  const [username, setUsername] = useState<string>("");
  const [modifyModalOpen, setModifyModalOpen] = useState(false);
  const [escalateModalOpen, setEscalateModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<ApprovalRequest | null>(null);
  const [selectedRequests, setSelectedRequests] = useState<number[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedBdm, setSelectedBdm] = useState<string>("all");
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

    // Sequential API calls for requests and reportees with independent error handling
    const fetchData = async () => {
      console.log(`[Dashboard.tsx:79] Starting sequential data fetch for user: ${asgardUsername}`);
      console.log('API URLs:', {
        requests: 'http://localhost:5678/webhook-test/fetch-requests',
        reportees: 'http://localhost:5678/webhook-test/get-reportees'
      });
      
      setIsLoading(true);
      setError(null);
      
      let requestsSuccess = false;
      let reporteesSuccess = false;
      const errors: string[] = [];
      
      // Initialize with empty arrays for graceful degradation
      let processedRequests: ApprovalRequest[] = [];
      let processedReportees: Reportee[] = [];
      
      // Fetch requests first
      try {
        console.log('[Dashboard.tsx] Fetching approval requests...');
        const requestsResponse = await fetch(`http://localhost:5678/webhook-test/fetch-requests`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: asgardUsername }),
        });
        
        if (!requestsResponse.ok) {
          throw new Error(`Failed to fetch requests: ${requestsResponse.status} ${requestsResponse.statusText}`);
        }
        
        const requestsData = await requestsResponse.json();
        
        // Process requests - handle direct array response
        if (Array.isArray(requestsData)) {
          processedRequests = requestsData as ApprovalRequest[];
        }
        
        console.log(`[Dashboard.tsx] Successfully processed ${processedRequests.length} requests`);
        requestsSuccess = true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`[Dashboard.tsx] Failed to fetch requests:`, { error, errorMessage, username: asgardUsername });
        errors.push(`Requests: ${errorMessage}`);
        toast({
          title: "Failed to fetch approval requests",
          description: `Unable to load approval requests: ${errorMessage}`,
          variant: "destructive"
        });
      }
      
      // Fetch reportees second, independently of requests result
      try {
        console.log('[Dashboard.tsx] Fetching reportees...');
        const reporteesResponse = await fetch(`http://localhost:5678/webhook-test/get-reportees`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            SE_Id: 35941,
            SE_UserName: "Kumarjk",
            ABM_Id: 2179814,
            ABM_UserName: asgardUsername
          }),
        });
        
        if (!reporteesResponse.ok) {
          throw new Error(`Failed to fetch reportees: ${reporteesResponse.status} ${reporteesResponse.statusText}`);
        }
        
        const reporteesData = await reporteesResponse.json();
        
        // Debug: Log the raw API response structure
        console.log('[Dashboard.tsx] Raw reportees API response:', reporteesData);
        console.log('[Dashboard.tsx] Response type:', typeof reporteesData);
        console.log('[Dashboard.tsx] Is array:', Array.isArray(reporteesData));
        
        // Process reportees - handle different possible response structures
        let rawReportees = [];
        
        if (Array.isArray(reporteesData)) {
          rawReportees = reporteesData;
        } else if (reporteesData && typeof reporteesData === 'object') {
          // Check if it's wrapped in a property like 'data', 'result', etc.
          if (Array.isArray(reporteesData.data)) {
            rawReportees = reporteesData.data;
          } else if (Array.isArray(reporteesData.result)) {
            rawReportees = reporteesData.result;
          } else if (Array.isArray(reporteesData.reportees)) {
            rawReportees = reporteesData.reportees;
          } else {
            // Try to find any array property
            for (const key in reporteesData) {
              if (Array.isArray(reporteesData[key])) {
                rawReportees = reporteesData[key];
                console.log(`[Dashboard.tsx] Found array data in property: ${key}`);
                break;
              }
            }
          }
        }
        
        
        console.log('[Dashboard.tsx] Extracted raw reportees:', rawReportees);
        console.log('[Dashboard.tsx] Raw reportees count:', rawReportees.length);
        
        // Now filter out invalid entries and create unique SE users
        if (Array.isArray(rawReportees) && rawReportees.length > 0) {
          // Log first few items to understand structure
          console.log('[Dashboard.tsx] First few raw reportees:', rawReportees.slice(0, 3));

          
        processedReportees = rawReportees
  .filter(reportee => 
    reportee && reportee.SE_UserName && reportee.SE_UserName.trim() !== ''
  )
  .filter((reportee, index, arr) => 
    arr.findIndex(r => r.SE_UserName === reportee.SE_UserName) === index
  );
          /*
          processedReportees = rawReportees
            .filter(reportee => {
              // Log each reportee to understand the structure
              console.log('[Dashboard.tsx] Processing reportee:', reportee);
              return reportee && reportee.SE_UserName && reportee.SE_UserName.trim() !== '';
            })
            .filter((reportee, index, arr) => 
              arr.findIndex(r => r.SE_UserName === reportee.SE_UserName) === index
            );
            */
        }
        
        console.log(`[Dashboard.tsx] Successfully processed ${processedReportees.length} unique reportees with valid SE_UserName`);
        console.log('[Dashboard.tsx] Unique SE Users:', processedReportees.map(r => r.SE_UserName));
        reporteesSuccess = true;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        console.error(`[Dashboard.tsx] Failed to fetch reportees:`, { error, errorMessage, username: asgardUsername });
        errors.push(`Reportees: ${errorMessage}`);
        toast({
          title: "Failed to fetch reportees",
          description: `Unable to load BDM data: ${errorMessage}`,
          variant: "destructive"
        });
      }
      
      // Set debug data with both successful and failed responses
      setDebugData({ 
        requests: requestsSuccess ? processedRequests : null, 
        reportees: reporteesSuccess ? processedReportees : null,
        errors: errors.length > 0 ? errors : null
      });
      
      // Update state with whatever data we managed to fetch
      setRequests(processedRequests);
      setReportees(processedReportees);
      
      // Set overall error state only if both APIs failed
      if (!requestsSuccess && !reporteesSuccess) {
        setError(`Both API calls failed: ${errors.join(', ')}`);
      } else if (errors.length > 0) {
        // Partial success - show warning but allow functionality
        setError(null); // Clear error to allow UI to function
        console.warn('[Dashboard.tsx] Partial data load:', { errors, requestsCount: processedRequests.length, reporteesCount: processedReportees.length });
      } else {
        // Full success
        setError(null);
        console.log(`[Dashboard.tsx] Successfully loaded all data: ${processedRequests.length} requests and ${processedReportees.length} reportees`);
      }
      
      setIsLoading(false);
    };
    
    fetchData();
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
    await executeAction(requestId.toString(), action as 'ACCEPTED' | 'REJECTED', { createdAt: request?.createdAt });
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
    await executeAction(selectedRequest.requestId.toString(), 'MODIFIED', { ...modifyData, createdAt: selectedRequest.createdAt });
  };

  const handleEscalateConfirm = async (remarks: string) => {
    if (!selectedRequest) return;

    await executeAction(selectedRequest.requestId.toString(), 'ESCALATED', { remarks, createdAt: selectedRequest.createdAt });
  };

  // Bulk action handlers
  const handleSelectAll = () => {
    const eligibleRequests = paginatedRequests.filter(r => r?.requestId && !isActionDisabled(r.requestId.toString()));
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
      
      await executeBulkAction(eligibleSelected.map(id => id.toString()), 'ACCEPTED', { createdAtMap });
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
      
      await executeBulkAction(eligibleSelected.map(id => id.toString()), 'REJECTED', { createdAtMap });
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

  // Filter requests based on search and BDM filter
  const filteredRequests = requests.filter(request => {
    const matchesSearch = 
      (request.customerId?.toString() || '').includes(searchQuery.toLowerCase()) ||
      (request.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (request.requestedByUserName || '').toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (selectedBdm === "all" || !selectedBdm) return true;
    
    // Filter by SE users who can approve - check if the selected SE user manages the ABM
    const selectedReportee = reportees.find(r => r.SE_UserName === selectedBdm);
    if (!selectedReportee) return false;
    
    // Check if the selected SE user manages the ABM of this request
    return request.ABM_UserName === selectedReportee.ABM_UserName;
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
          seUsers={reportees}
          selectedSeUser={selectedBdm}
          onSeUserChange={setSelectedBdm}
        />

        {/* Bulk Action Bar */}
        <BulkActionBar
          selectedRequests={selectedRequests.map(id => id.toString())}
          totalRequests={paginatedRequests.filter(r => r?.requestId && !isActionDisabled(r.requestId.toString())).length}
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
                request?.requestId ? (
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
                ) : null
              )).filter(Boolean)}
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