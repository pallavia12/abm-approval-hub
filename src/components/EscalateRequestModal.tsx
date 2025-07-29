import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface EscalateRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (remarks: string) => void;
  requestId: string;
}

const EscalateRequestModal = ({ isOpen, onClose, onConfirm, requestId }: EscalateRequestModalProps) => {
  const [remarks, setRemarks] = useState<string>("");

  const handleConfirm = () => {
    onConfirm(remarks);
    onClose();
    setRemarks("");
  };

  const handleClose = () => {
    onClose();
    setRemarks("");
  };

  const remainingChars = 200 - remarks.length;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Escalate Request {requestId}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="remarks">
              Remarks
            </Label>
            <Textarea
              id="remarks"
              value={remarks}
              onChange={(e) => setRemarks(e.target.value.slice(0, 200))}
              placeholder="Enter remarks for escalation..."
              className="min-h-[100px]"
              maxLength={200}
            />
            <div className="text-sm text-muted-foreground text-right">
              {remainingChars} characters remaining
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={remarks.trim().length === 0}>
            Escalate
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EscalateRequestModal;