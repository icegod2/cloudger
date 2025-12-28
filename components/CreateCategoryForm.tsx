'use client';

import * as React from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useRouter } from 'next/navigation';

interface Category {
  id: number;
  name: string;
}

export function CreateCategoryForm({ type, onSuccess, initialParentId }: { type: 'income' | 'expense', onSuccess?: () => void, initialParentId?: number | null }) {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [parentId, setParentId] = React.useState<string>(initialParentId ? initialParentId.toString() : 'none');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [parents, setParents] = React.useState<Category[]>([]);

  React.useEffect(() => {
    async function fetchParents() {
      const response = await fetch(`/api/categories?type=${type}`);
      if (response.ok) {
        const data = await response.json();
        // Allow all categories to be parents for infinite nesting
        setParents(data);
      }
    }
    fetchParents();
  }, [type]);

  // Update parentId if initialParentId changes
  React.useEffect(() => {
      if (initialParentId) {
          setParentId(initialParentId.toString());
      }
  }, [initialParentId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          type, 
          parentId: parentId === 'none' ? null : parentId 
        }),
      });

      if (!response.ok) throw new Error('Failed to create category');

      setName('');
      setParentId('none');
      router.refresh();
      window.dispatchEvent(new Event('vibe-data-change'));
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      alert('Failed to create category.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 p-1">
      <div className="grid gap-2">
        <Label htmlFor="cat-name">Category Name</Label>
        <Input
          id="cat-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Groceries, Bonus"
          className="rounded-xl"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="parent">Parent Category (Optional)</Label>
        <Select value={parentId} onValueChange={setParentId}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select parent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (Top Level)</SelectItem>
            {parents.map((p) => (
              <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Button type="submit" className="w-full rounded-full mt-2" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create {type === 'income' ? 'Income' : 'Expense'} Category
      </Button>
    </form>
  );
}
