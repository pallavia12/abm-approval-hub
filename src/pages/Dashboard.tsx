import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { LogOut } from "lucide-react";

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
  const navigate = useNavigate();
  const { toast } = useToast();

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

  const handleAction = (requestId: string, action: string) => {
    toast({
      title: "Action Taken",
      description: `${action} action taken for request ${requestId}`,
    });
    // Here you would typically send the action to your backend
  };

  const renderActionButtons = (request: ApprovalRequest) => {
    const commonButtons = (
      <>
        <Button 
          variant="destructive" 
          size="sm"
          onClick={() => handleAction(request.requestId, "Reject")}
        >
          Reject
        </Button>
        <Button 
          variant="outline" 
          size="sm"
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
                    <TableHead>Request ID</TableHead>
                    <TableHead>Customer Info</TableHead>
                    <TableHead>Campaign Details</TableHead>
                    <TableHead>Order Info</TableHead>
                    <TableHead>Discount Details</TableHead>
                    <TableHead>Requested By</TableHead>
                    <TableHead>Eligibility</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <TableRow key={request.requestId}>
                      <TableCell className="font-medium">
                        {request.requestId}
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{request.name}</div>
                          <div className="text-sm text-muted-foreground">
                            ID: {request.customerId}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {request.contactNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div>{request.campaignType}</div>
                          {request.skuName && (
                            <div className="text-sm text-muted-foreground">
                              SKU: {request.skuName}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{request.orderValue} kg</div>
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
                          {request.reason && (
                            <div className="text-sm text-muted-foreground">
                              Reason: {request.reason}
                            </div>
                          )}
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
                        <Badge 
                          variant={request.eligibility === 1 ? "default" : "destructive"}
                        >
                          {request.eligibility === 1 ? "Eligible" : "Not Eligible"}
                        </Badge>
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
      </div>
    </div>
  );
};

export default Dashboard;