import { LoaderCircle, Trash2 } from "lucide-react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { Button } from "@/components/ui/button";

type DeleteDocumentDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  filename: string;
  isDeleting: boolean;
  onConfirm: () => void;
};

export function DeleteDocumentDialog({
  open,
  onOpenChange,
  filename,
  isDeleting,
  onConfirm,
}: DeleteDocumentDialogProps) {
  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isDeleting) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <DialogContent className="rounded-2xl border-zinc-200 bg-white dark:border-white/10 dark:bg-[#1a1a22]">
        <DialogHeader>
          <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-red-500/10">
            <Trash2 className="size-5 text-red-500" />
          </div>

          <DialogTitle>Delete document?</DialogTitle>

          <DialogDescription>
            Are you sure you want to permanently delete{" "}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              {filename}
            </span>
            ?
            <span className="mt-2 block">
              This removes the uploaded file and its indexed content. This
              action cannot be undone.
            </span>
          </DialogDescription>
        </DialogHeader>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            disabled={isDeleting}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>

          <Button
            type="button"
            disabled={isDeleting}
            onClick={onConfirm}
            className="bg-red-600 text-white hover:bg-red-500"
          >
            {isDeleting ? (
              <>
                <LoaderCircle className="size-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="size-4" />
                Delete document
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
