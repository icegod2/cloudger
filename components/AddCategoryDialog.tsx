'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { CreateCategoryForm } from "@/components/CreateCategoryForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from 'lucide-react';

export function AddCategoryDialog({ 
    type, 
    parentId,
    trigger 
}: { 
    type: 'income' | 'expense', 
    parentId?: number,
    trigger?: React.ReactNode 
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
            <Button variant="outline" size="sm" className="rounded-full gap-2 border-zinc-200 dark:border-zinc-800">
                <Plus className="w-4 h-4" />
                Add Category
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>New {type === 'income' ? 'Income' : 'Expense'} Category</DialogTitle>
        </DialogHeader>
        <CreateCategoryForm type={type} onSuccess={() => setOpen(false)} initialParentId={parentId} />
      </DialogContent>
    </Dialog>
  );
}
