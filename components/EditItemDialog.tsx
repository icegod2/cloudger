'use client';

import * as React from 'react';
import { Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useRouter } from 'next/navigation';

interface EditItemDialogProps {
  id: number;
  initialName: string;
  type: 'account' | 'category';
  trigger?: React.ReactNode;
}

export function EditItemDialog({ id, initialName, type, trigger }: EditItemDialogProps) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [name, setName] = React.useState(initialName);
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name || name === initialName) {
        setOpen(false);
        return;
    }

    setIsSubmitting(true);
    try {
      const endpoint = type === 'account' ? 'accounts' : 'categories';
      const response = await fetch(`/api/${endpoint}/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      if (!response.ok) throw new Error(`Failed to update ${type}`);

      setOpen(false);
      router.refresh();
      // Notify other components (like Sidebar) to refresh data
      window.dispatchEvent(new Event('vibe-data-change'));
    } catch (error) {
      console.error(error);
      alert(`Failed to update ${type}.`);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ? trigger : (
            <Button variant="ghost" size="icon" className="h-7 w-7 text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100">
                <Pencil className="h-3 w-3" />
            </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <DialogTitle>Edit {type === 'account' ? 'Account' : 'Category'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="rounded-xl"
            />
          </div>
          <DialogFooter>
            <Button type="submit" className="rounded-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
