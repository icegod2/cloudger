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

export function CreateAccountForm({ 
    onSuccess, 
    defaultType = 'asset' 
}: { 
    onSuccess?: () => void, 
    defaultType?: 'asset' | 'liability' 
}) {
  const router = useRouter();
  const [name, setName] = React.useState('');
  const [type, setType] = React.useState<'asset' | 'liability'>(defaultType);
  const [parentId, setParentId] = React.useState<string>('none');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [parents, setParents] = React.useState<any[]>([]);

  React.useEffect(() => {
    async function fetchParents() {
      const response = await fetch('/api/accounts');
      if (response.ok) {
        const data = await response.json();
        // Only accounts of the same type can be parents
        setParents(data.filter((a: any) => a.type === type));
      }
    }
    fetchParents();
  }, [type]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name, 
          type, 
          parentId: parentId === 'none' ? null : parseInt(parentId, 10)
        }),
      });

      if (!response.ok) throw new Error('Failed to create account');

      setName('');
      setParentId('none');
      router.refresh();
      window.dispatchEvent(new Event('vibe-data-change'));
      if (onSuccess) onSuccess();
    } catch (error) {
      console.error(error);
      alert('Failed to create account.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="grid gap-6 p-1">
      <div className="grid gap-2">
        <Label htmlFor="name">Account Name</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Savings, Wallet"
          className="rounded-xl"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor="type">Account Type</Label>
        <Select value={type} onValueChange={(val) => { setType(val); setParentId('none'); }}>
          <SelectTrigger className="rounded-xl">
            <SelectValue placeholder="Select type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="asset">Asset (Cash, Bank)</SelectItem>
            <SelectItem value="liability">Liability (Credit Card, Loan)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-2">
        <Label htmlFor="parent">Parent Account (Optional)</Label>
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
        Create Account
      </Button>
    </form>
  );
}
