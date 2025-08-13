import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

const Login = () => {
  const [username, setUsername] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) {
      toast({
        title: "Error",
        description: "Please enter your Asgard username",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    try {
      // Validate username with webhook
      const response = await fetch(
        `https://ninjasndanalytics.app.n8n.cloud/webhook-test/check-abm-user?username=${encodeURIComponent(username.trim())}`, {
        //`http://localhost:5678/webhook-test/check-abm-user?username=${encodeURIComponent(username.trim())}`, {    
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to validate username");
      }

      const result = await response.json();
      
      if (result.status === "success") {
        localStorage.setItem("asgard_username", username);
        toast({
          title: "Success",
          description: "Logged in successfully",
        });
        navigate("/dashboard");
      } else {
        toast({
          title: "Invalid Username",
          description: "The username is not valid or not found in the system",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Validation Error",
        description: "Unable to validate username. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">ABM Approval Portal</CardTitle>
          <CardDescription className="text-center">
            Enter your Asgard username to continue
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Asgard Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="Enter your username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;