'use client';

import * as React from 'react';
import { Button } from "@/components/ui/button";
import { CreateAccountForm } from "@/components/CreateAccountForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus } from 'lucide-react';

export function AddAccountDialog({ type }: { type?: 'asset' | 'liability' }) {
  const [open, setOpen] = React.useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="rounded-full gap-2 border-zinc-200 dark:border-zinc-800">
          <Plus className="w-4 h-4" />
          Add Account
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>New {type === 'asset' ? 'Asset' : type === 'liability' ? 'Liability' : 'Account'}</DialogTitle>
        </DialogHeader>
        <CreateAccountForm 
            defaultType={type} 
            onSuccess={() => setOpen(false)} 
        />
      </DialogContent>
    </Dialog>
  );
}
