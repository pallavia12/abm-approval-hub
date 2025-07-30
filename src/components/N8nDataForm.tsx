import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';

interface FormData {
  abmStatus: string;
  abmOrderQty: string;
  abmDiscountType: string;
  abmDiscountValue: string;
  abmRemarks: string;
  abmReviewedBy: string;
  webhookUrl: string;
}

export const N8nDataForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormData>({
    defaultValues: {
      abmStatus: '',
      abmOrderQty: '',
      abmDiscountType: '',
      abmDiscountValue: '',
      abmRemarks: '',
      abmReviewedBy: '',
      webhookUrl: ''
    }
  });

  const onSubmit = async (data: FormData) => {
    if (!data.webhookUrl) {
      toast({
        title: "Error",
        description: "Please enter the n8n webhook URL",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        abmStatus: data.abmStatus || null,
        abmOrderQty: data.abmOrderQty ? parseInt(data.abmOrderQty) : null,
        abmDiscountType: data.abmDiscountType || null,
        abmDiscountValue: data.abmDiscountValue ? parseFloat(data.abmDiscountValue) : null,
        abmRemarks: data.abmRemarks || null,
        abmReviewedBy: data.abmReviewedBy ? parseInt(data.abmReviewedBy) : null,
        abmReviewedAt: new Date().toISOString()
      };

      console.log('Sending to n8n webhook:', payload);

      const response = await fetch(data.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Data sent to n8n webhook successfully",
        });
        form.reset();
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Error sending to n8n:', error);
      toast({
        title: "Error",
        description: `Failed to send data to n8n webhook: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Send Data to n8n Webhook</CardTitle>
        <CardDescription>
          Fill out the form to send data to your n8n workflow
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="webhookUrl"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>n8n Webhook URL *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="https://your-n8n-instance.com/webhook/..." 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abmStatus"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>ABM Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="APPROVED">Approved</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="PENDING">Pending</SelectItem>
                      <SelectItem value="UNDER_REVIEW">Under Review</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abmOrderQty"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Order Quantity</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="150" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abmDiscountType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Type</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select discount type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="PERCENTAGE">Percentage</SelectItem>
                      <SelectItem value="FIXED">Fixed Amount</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abmDiscountValue"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Discount Value</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      step="0.01"
                      placeholder="7.50" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abmRemarks"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Remarks</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Enter your remarks here..."
                      className="min-h-[100px]"
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="abmReviewedBy"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reviewed By (User ID)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number"
                      placeholder="456" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isLoading} className="w-full">
              {isLoading ? "Sending..." : "Send to n8n"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
};