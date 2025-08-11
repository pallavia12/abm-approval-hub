import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ModifyRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: ModifyData) => void;
  requestId: string;
  currentData: {
    orderValue: number;
    discountType: string;
    discountValue: number;
  };
}

export interface ModifyData {
  orderKg?: number;
  discountType?: string;
  discountValue?: number;
}

const ModifyRequestModal = ({ isOpen, onClose, onConfirm, requestId, currentData }: ModifyRequestModalProps) => {
  const [orderKg, setOrderKg] = useState<string>("");
  const [discountType, setDiscountType] = useState<string>("");
  const [discountValue, setDiscountValue] = useState<string>("");

  const hasChanges = orderKg.trim() !== "" || discountType !== "" || discountValue.trim() !== "";

  const handleConfirm = () => {
    const modifyData: ModifyData = {};
    
    if (orderKg.trim() !== "") {
      modifyData.orderKg = parseFloat(orderKg);
    }
    if (discountType !== "") {
      modifyData.discountType = discountType;
    }
    if (discountValue.trim() !== "") {
      modifyData.discountValue = parseFloat(discountValue);
    }

    onConfirm(modifyData);
    onClose();
    
    // Reset form
    setOrderKg("");
    setDiscountType("");
    setDiscountValue("");
  };

  const handleClose = () => {
    onClose();
    // Reset form
    setOrderKg("");
    setDiscountType("");
    setDiscountValue("");
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Modify Request {requestId}</DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="orderKg" className="text-right">
              Order KG
            </Label>
            <Input
              id="orderKg"
              type="number"
              value={orderKg}
              onChange={(e) => setOrderKg(e.target.value)}
              placeholder={currentData.orderValue.toString()}
              className="col-span-3"
            />
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="discountType" className="text-right">
              Discount Type
            </Label>
            <Select value={discountType} onValueChange={setDiscountType}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder={currentData.discountType} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Re 1 per kg">Re 1 per kg</SelectItem>
                <SelectItem value="Rs 0.75 per kg">Rs 0.75 per kg</SelectItem>
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="discountValue" className="text-right">
              Discount Value
            </Label>
            <Input
              id="discountValue"
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={currentData.discountValue.toString()}
              className="col-span-3"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={!hasChanges}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModifyRequestModal;