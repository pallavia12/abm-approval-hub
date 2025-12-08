import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Loader2, Wallet } from "lucide-react";
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
interface Reportee {
  SE_Id: number;
  SE_UserName: string;
  ABM_Id: number;
  ABM_UserName: string;
}

interface BudgetData {
  allocatedBudget: number;
  consumedBudget: number;
  balance: number;
  weekStart: string;
  weekEnd: string;
}

// API Configuration
// Use VITE_API_BASE_URL to switch between n8n and local backend
// Set VITE_API_BASE_URL=http://localhost:3001 to use local backend
// Leave unset or set to n8n URL to use n8n webhooks
const getApiBaseUrl = () => {
  return import.meta.env.VITE_API_BASE_URL || "https://ninjasndanalytics.app.n8n.cloud";
};

const getApiUrl = (endpoint: string) => {
  return `${getApiBaseUrl()}/webhook/${endpoint}`;
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
  const [selectedSeUser, setSelectedSeUser] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [debugData, setDebugData] = useState<any>(null);
  const [showDebug, setShowDebug] = useState(false);
  const [budgetData, setBudgetData] = useState<BudgetData | null>(null);
  const [isLoadingBudget, setIsLoadingBudget] = useState(false);
  const requestsPerPage = 10;
  const navigate = useNavigate();
  // Reject modal state
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectRequestId, setRejectRequestId] = useState<number | null>(null);
  const {
    toast
  } = useToast();
  const {
    executeAction,
    executeBulkAction,
    isActionDisabled,
    getActionTaken,
    isRequestLoading,
    isBulkLoading
  } = useActionHandler();
  // Helper function to get current week (Monday to Sunday)
  const getCurrentWeek = () => {
    const now = new Date();
    // Get local date components to avoid timezone issues
    const year = now.getFullYear();
    const month = now.getMonth();
    const date = now.getDate();
    const day = now.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Calculate days to subtract to get to Monday
    // If today is Sunday (0), we want last Monday (subtract 6 days)
    // If today is Monday (1), we want today (subtract 0 days)
    // If today is Tuesday (2), we want yesterday (subtract 1 day)
    // etc.
    let daysToMonday;
    if (day === 0) {
      // Sunday: go back 6 days to get Monday
      daysToMonday = 6;
    } else {
      // Monday (1) through Saturday (6): subtract (day - 1) days
      daysToMonday = day - 1;
    }
    
    // Create Monday date using local date components
    const monday = new Date(year, month, date - daysToMonday, 0, 0, 0, 0);
    
    // Create Sunday date (6 days after Monday)
    const sunday = new Date(year, month, date - daysToMonday + 6, 23, 59, 59, 999);
    
    return { monday, sunday };
  };

  // Helper function to format yearWeek (WW format - just week number)
  const getYearWeek = (date: Date) => {
    const year = date.getFullYear();
    const startOfYear = new Date(year, 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    return weekNumber.toString().padStart(2, '0');
  };

  // Format date for display (e.g., "01 Dec")
  const formatDateDisplay = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    return `${day} ${month}`;
  };

  // Fetch budget data from n8n webhook
  const fetchBudgetData = async () => {
    setIsLoadingBudget(true);
    try {
      // Calculate current week dates in frontend
      const { monday, sunday } = getCurrentWeek();
      const yearWeek = getYearWeek(monday); // Format: 'WW' (just week number)
      const asgardUsername = localStorage.getItem("asgard_username") || "";

      if (!asgardUsername) {
        console.warn('[Dashboard] No username found, cannot fetch budget');
        setIsLoadingBudget(false);
        return;
      }

      // Use n8n webhook API
      const budgetUrl = `https://ninjasndanalytics.app.n8n.cloud/webhook/get-abm-budget`;
      
      console.log('[Dashboard] Fetching budget from:', budgetUrl);
      console.log('[Dashboard] Current week:', { monday: monday.toISOString(), sunday: sunday.toISOString(), yearWeek, abmUsername: asgardUsername });
      
      const response = await fetch(budgetUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          abmUsername: asgardUsername,
          yearWeek: yearWeek
        }),
      });
      
      console.log('[Dashboard] Budget response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Dashboard] Budget API error:', response.status, errorText);
        throw new Error(`Failed to fetch budget: ${response.status} - ${errorText}`);
      }
      
      const result = await response.json();
      console.log('[Dashboard] Budget API result:', result);
      
      // Parse the API response structure: [{allocatedBudget, consumedBudget}]
      let allocated = 0;
      let consumed = 0;
      
      if (Array.isArray(result) && result.length > 0) {
        const budgetData = result[0];
        allocated = parseFloat(budgetData.allocatedBudget) || 0;
        consumed = parseFloat(budgetData.consumedBudget) || 0;
      }
      
      // Calculate balance in frontend
      const balance = allocated - consumed;

      console.log('[Dashboard] Parsed budget values:', { allocated, consumed, balance });

      // Format dates as YYYY-MM-DD using local date components to avoid timezone issues
      const formatDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };

      setBudgetData({
        allocatedBudget: allocated,
        consumedBudget: consumed,
        balance: balance,
        weekStart: formatDateString(monday),
        weekEnd: formatDateString(sunday),
      });
    } catch (error) {
      console.error('[Dashboard] Error fetching budget:', error);
      if (error instanceof Error) {
        console.error('[Dashboard] Error details:', {
          message: error.message,
          name: error.name
        });
      }
      // Set default values on error
      const { monday, sunday } = getCurrentWeek();
      const formatDateString = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      };
      setBudgetData({
        allocatedBudget: 0,
        consumedBudget: 0,
        balance: 0,
        weekStart: formatDateString(monday),
        weekEnd: formatDateString(sunday),
      });
    } finally {
      setIsLoadingBudget(false);
    }
  };

  useEffect(() => {
    const asgardUsername = localStorage.getItem("asgard_username");
    if (!asgardUsername) {
      navigate("/");
      return;
    }
    setUsername(asgardUsername);
    
    // Fetch budget data on page load
    fetchBudgetData();

    // Sequential API calls for requests and reportees with independent error handling
    const fetchData = async () => {
      console.log(`[Dashboard.tsx:79] Starting sequential data fetch for user: ${asgardUsername}`);
      console.log('API URLs:', {
        requests: 'https://ninjasndanalytics.app.n8n.cloud/webhook/fetch-requests',
        //'http://localhost:5678/webhook-test/fetch-requests',
        reportees: 'https://ninjasndanalytics.app.n8n.cloud/webhook/get-reportees'
        //'http://localhost:5678/webhook-test/get-reportees'
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
        const requestsResponse = await fetch(getApiUrl('fetch-requests'), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            username: asgardUsername
          })
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
        console.error(`[Dashboard.tsx] Failed to fetch requests:`, {
          error,
          errorMessage,
          username: asgardUsername
        });
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
        const reporteesResponse = await fetch(getApiUrl('get-reportees'), {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            SE_Id: 35941,
            SE_UserName: "Kumarjk",
            ABM_Id: 2179814,
            ABM_UserName: asgardUsername
          })
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
          processedReportees = rawReportees.filter(reportee => reportee && reportee.SE_UserName && reportee.SE_UserName.trim() !== '').filter((reportee, index, arr) => arr.findIndex(r => r.SE_UserName === reportee.SE_UserName) === index);
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
        console.error(`[Dashboard.tsx] Failed to fetch reportees:`, {
          error,
          errorMessage,
          username: asgardUsername
        });
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
        console.warn('[Dashboard.tsx] Partial data load:', {
          errors,
          requestsCount: processedRequests.length,
          reporteesCount: processedReportees.length
        });
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
      description: "You have been logged out successfully"
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
    if (action === "Reject") {
      setRejectRequestId(requestId);
      setRejectReason("");
      setRejectModalOpen(true);
      return;
    }
    const request = requests.find(r => r.requestId === requestId);
    await executeAction(requestId.toString(), action as 'ACCEPTED' | 'REJECTED', {
      createdAt: request?.createdAt
    });
  };
  const handleConfirmReject = async () => {
    if (!rejectRequestId) return;
    const reason = rejectReason.trim();
    if (reason === "") {
      toast({ title: "Reason required", description: "Rejection reason cannot be empty", variant: "destructive" });
      return;
    }
    const request = requests.find(r => r.requestId === rejectRequestId);
    await executeAction(rejectRequestId.toString(), 'REJECTED', {
      createdAt: request?.createdAt,
      remarks: reason
    });
    setRejectModalOpen(false);
    setRejectRequestId(null);
    setRejectReason("");
  };
  const handleModifyConfirm = async (modifyData: ModifyData) => {
    if (!selectedRequest) return;
    const updatedRequests = requests.map(request => {
      if (request.requestId === selectedRequest.requestId) {
        return {
          ...request,
          ...(modifyData.orderKg !== undefined && {
            orderQty: modifyData.orderKg
          }),
          ...(modifyData.discountType !== undefined && {
            discountType: modifyData.discountType
          }),
          ...(modifyData.discountValue !== undefined && {
            discountValue: modifyData.discountValue
          })
        };
      }
      return request;
    });
    setRequests(updatedRequests);
    await executeAction(selectedRequest.requestId.toString(), 'MODIFIED', {
      ...modifyData,
      createdAt: selectedRequest.createdAt
    });
  };
  const handleEscalateConfirm = async (remarks: string) => {
    if (!selectedRequest) return;
    await executeAction(selectedRequest.requestId.toString(), 'ESCALATED', {
      remarks,
      createdAt: selectedRequest.createdAt
    });
  };

  // Bulk action handlers
  const handleSelectAll = () => {
    const eligibleRequests = paginatedRequests.filter(r => r?.requestId && !isActionDisabled(r.requestId.toString()) && (r.abmStatus === null || r.abmStatus === undefined));
    setSelectedRequests(eligibleRequests.map(r => r.requestId));
  };
  const handleDeselectAll = () => {
    setSelectedRequests([]);
  };
  const handleBulkAccept = async () => {
    const eligibleSelected = selectedRequests.filter(id => {
      const request = requests.find(r => r.requestId === id);
      return request?.eligible === 1 && !isActionDisabled(id.toString()) && (request.abmStatus === null || request.abmStatus === undefined);
    });
    if (eligibleSelected.length > 0) {
      const createdAtMap: Record<string, string> = {};
      eligibleSelected.forEach(id => {
        const request = requests.find(r => r.requestId === id);
        if (request?.createdAt) {
          createdAtMap[id.toString()] = request.createdAt;
        }
      });
      await executeBulkAction(eligibleSelected.map(id => id.toString()), 'ACCEPTED', {
        createdAtMap
      });
      setSelectedRequests([]);
    }
  };
  const handleBulkReject = async () => {
    const eligibleSelected = selectedRequests.filter(id => {
      const request = requests.find(r => r.requestId === id);
      return !isActionDisabled(id.toString()) && (request?.abmStatus === null || request?.abmStatus === undefined);
    });
    if (eligibleSelected.length > 0) {
      const createdAtMap: Record<string, string> = {};
      eligibleSelected.forEach(id => {
        const request = requests.find(r => r.requestId === id);
        if (request?.createdAt) {
          createdAtMap[id.toString()] = request.createdAt;
        }
      });
      await executeBulkAction(eligibleSelected.map(id => id.toString()), 'REJECTED', {
        createdAtMap
      });
      setSelectedRequests([]);
    }
  };
  const handleCheckboxChange = (requestId: number, checked: boolean) => {
    // Don't allow selection if abmStatus is not null
    const request = requests.find(r => r.requestId === requestId);
    if (request?.abmStatus !== null && request?.abmStatus !== undefined) {
      return;
    }
    if (checked) {
      setSelectedRequests(prev => [...prev, requestId]);
    } else {
      setSelectedRequests(prev => prev.filter(id => id !== requestId));
    }
  };

  // Filter requests based on search and SE User filter
  const filteredRequests = useMemo(() => {
    console.log('[Dashboard] Filtering with:', { 
      totalRequests: requests.length, 
      searchQuery, 
      selectedSeUser,
      reporteesCount: reportees.length 
    });
    
    const filtered = requests.filter(request => {    
      // Search filter
      const matchesSearch = searchQuery === '' || 
                           (request.customerId?.toString() || '').includes(searchQuery.toLowerCase()) || 
                           (request.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                           (request.requestedByUserName || '').toLowerCase().includes(searchQuery.toLowerCase());
      
      if (!matchesSearch) {
        return false;
      }
      
      // SE User filter - show all if "all" is selected
      if (selectedSeUser === "all" || !selectedSeUser) {
        return true;
      }
      
      // Filter by requests made by the selected SE user
      const matchesSeUser = request.requestedByUserName && 
                           request.requestedByUserName.toLowerCase() === selectedSeUser.toLowerCase();
      
      console.log('[Dashboard] SE User filter check:', { 
        requestId: request.requestId,
        requestedBy: request.requestedByUserName,
        selectedSeUser,
        matches: matchesSeUser
      });
      
      return matchesSeUser;
    });
    
    console.log('[Dashboard] Filtered results:', { 
      originalCount: requests.length, 
      filteredCount: filtered.length,
      selectedSeUser,
      showingRequestsBy: selectedSeUser === "all" ? "all users" : selectedSeUser
    });
    
    return filtered;
  }, [requests, searchQuery, selectedSeUser, reportees]);

  // Calculate pagination
  const totalFilteredRequests = filteredRequests.length;
  const calculatedTotalPages = Math.ceil(totalFilteredRequests / requestsPerPage);
  
  // Update total pages when filtered requests change
  useEffect(() => {
    setTotalPages(calculatedTotalPages);
  }, [calculatedTotalPages]);

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSeUser, searchQuery]);

  // Get current page requests
  const startIndex = (currentPage - 1) * requestsPerPage;
  const endIndex = startIndex + requestsPerPage;
  const paginatedRequests = filteredRequests.slice(startIndex, endIndex);
  return <div className="min-h-screen bg-background p-4">
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
        {showDebug && debugData && <Card className="mb-6">
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
          </Card>}

        {/* Budget Summary Card */}
        {budgetData && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Weekly Cart level Campaign Budget</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              {isLoadingBudget ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                  <span className="ml-2 text-sm text-muted-foreground">Loading budget...</span>
                </div>
              ) : (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-6">
                {/* Wallet Icon */}
                <div className="flex-shrink-0">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Wallet className="h-6 w-6 text-primary" />
                  </div>
                </div>
                
                {/* Budget Details */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                  {/* Week Period */}
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground mb-1">Period</span>
                    <span className="text-base font-medium">
                      {formatDateDisplay(new Date(budgetData.weekStart))} – {formatDateDisplay(new Date(budgetData.weekEnd))}
                    </span>
                  </div>
                  
                  {/* Allocated */}
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground mb-1">Allocated</span>
                    <span className="text-base font-medium">₹{budgetData.allocatedBudget.toLocaleString('en-IN')}</span>
                  </div>
                  
                  {/* Used */}
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground mb-1">Used</span>
                    <span className="text-base font-medium">₹{budgetData.consumedBudget.toLocaleString('en-IN')}</span>
                  </div>
                  
                  {/* Balance */}
                  <div className="flex flex-col">
                    <span className="text-sm text-muted-foreground mb-1">Balance</span>
                    <span className={`text-base font-medium px-2 py-1 rounded inline-block ${
                      budgetData.balance >= 0 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
                    }`}>
                      ₹{budgetData.balance.toLocaleString('en-IN')}
                    </span>
                  </div>
                </div>
              </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Search and Filters */}
        {reportees.length > 0 && (
          <SearchAndFilters 
            searchQuery={searchQuery} 
            onSearchChange={setSearchQuery} 
            seUsers={reportees} 
            selectedSeUser={selectedSeUser} 
            onSeUserChange={setSelectedSeUser} 
          />
        )}

        {/* Bulk Action Bar */}
        <BulkActionBar selectedRequests={selectedRequests.map(id => id.toString())} totalRequests={paginatedRequests.filter(r => r?.requestId && !isActionDisabled(r.requestId.toString()) && (r.abmStatus === null || r.abmStatus === undefined)).length} onSelectAll={handleSelectAll} onDeselectAll={handleDeselectAll} onBulkAccept={handleBulkAccept} onBulkReject={handleBulkReject} isLoading={isBulkLoading} />

        {/* Request Cards */}
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">
              Approval Requests ({totalFilteredRequests})
            </h2>
            <div className="flex gap-2">
              
            </div>
          </div>
          
          {isLoading ? <Card>
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-muted-foreground">Loading approval requests...</p>
              </CardContent>
            </Card> : error ? <Card>
              <CardContent className="p-8 text-center">
                <div className="text-destructive mb-4">
                  <p className="font-medium">Failed to load requests</p>
                  <p className="text-sm mt-2">{error}</p>
                </div>
                <Button onClick={() => window.location.reload()} variant="outline">
                  Try Again
                </Button>
              </CardContent>
            </Card> : paginatedRequests.length === 0 ? <Card>
              <CardContent className="p-8 text-center">
                <p className="text-muted-foreground">
                  {requests.length === 0 ? "No approval requests available." : "No requests found matching your criteria."}
                </p>
              </CardContent>
            </Card> : <div className="grid gap-4">
              {paginatedRequests.map(request => request?.requestId ? <RequestCard key={request.requestId} request={request} isSelected={selectedRequests.includes(request.requestId)} isDisabled={isActionDisabled(request.requestId.toString()) || request.abmStatus !== null && request.abmStatus !== undefined} onSelectionChange={handleCheckboxChange} onAction={handleAction} actionTaken={getActionTaken(request.requestId.toString())} bulkModeActive={selectedRequests.length > 0} isLoading={isRequestLoading(request.requestId.toString())} /> : null).filter(Boolean)}
            </div>}

          {/* Pagination */}
          {!isLoading && !error && <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />}
        </div>

        {/* Modals */}
        {selectedRequest && <>
            <ModifyRequestModal isOpen={modifyModalOpen} onClose={() => setModifyModalOpen(false)} onConfirm={handleModifyConfirm} requestId={selectedRequest.requestId.toString()} currentData={{
          orderValue: selectedRequest.orderQty,
          discountType: selectedRequest.discountType,
          discountValue: selectedRequest.discountValue || 0
        }} />
            <EscalateRequestModal isOpen={escalateModalOpen} onClose={() => setEscalateModalOpen(false)} onConfirm={handleEscalateConfirm} requestId={selectedRequest.requestId.toString()} />
          </>}

        {/* Reject Reason Modal */}
        <Dialog open={rejectModalOpen} onOpenChange={setRejectModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter rejection reason</DialogTitle>
            </DialogHeader>
            <Textarea
              placeholder="Type the reason for rejection"
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={5}
            />
            <DialogFooter>
              <Button variant="outline" onClick={() => setRejectModalOpen(false)}>Cancel</Button>
              <Button onClick={handleConfirmReject}>Confirm Reject</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};
export default Dashboard;