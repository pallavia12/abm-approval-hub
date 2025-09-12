import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckSquare, Square } from "lucide-react";

interface BulkActionBarProps {
  selectedRequests: string[];
  totalRequests: number;
  onSelectAll: () => void;
  onDeselectAll: () => void;
  onBulkAccept: () => void;
  onBulkReject: () => void;
  isLoading?: boolean;
}

export const BulkActionBar = ({
  selectedRequests,
  totalRequests,
  onSelectAll,
  onDeselectAll,
  onBulkAccept,
  onBulkReject,
  isLoading = false
}: BulkActionBarProps) => {
  const hasSelections = selectedRequests.length > 0;
  const allSelected = selectedRequests.length === totalRequests && totalRequests > 0;

  return (
    <Card className="mb-4">
      <CardContent className="py-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={allSelected ? onDeselectAll : onSelectAll}
              className="flex items-center gap-2"
              disabled={isLoading}
            >
              {allSelected ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {allSelected ? 'Deselect All' : 'Select All'}
            </Button>
            
            {hasSelections && (
              <span className="text-sm text-muted-foreground">
                {selectedRequests.length} request{selectedRequests.length !== 1 ? 's' : ''} selected
              </span>
            )}
          </div>

          {hasSelections && (
            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                variant="default"
                size="sm"
                onClick={onBulkAccept}
                className="flex-1 sm:flex-none"
                disabled={isLoading}
              >
                Accept ({selectedRequests.length})
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={onBulkReject}
                className="flex-1 sm:flex-none"
                disabled={isLoading}
              >
                Reject ({selectedRequests.length})
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};