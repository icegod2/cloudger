'use client';

import { useActionState } from 'react';
import { authenticate } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

export default function LoginForm() {
  const [errorMessage, dispatch, isPending] = useActionState(
    authenticate,
    undefined,
  );

  return (
    <form action={dispatch} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="m@example.com"
          required
          className="rounded-xl"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          name="password"
          required
          minLength={6}
          className="rounded-xl"
        />
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <Button type="submit" className="w-full rounded-full" aria-disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log in
        </Button>
        {errorMessage && (
          <div
            className="flex h-8 items-end space-x-1"
            aria-live="polite"
            aria-atomic="true"
          >
            <p className="text-sm text-red-500">{errorMessage}</p>
          </div>
        )}
        <div className="text-center text-sm text-zinc-500">
            Don&apos;t have an account?{' '}
            <a href="/register" className="font-medium hover:underline text-zinc-900 dark:text-zinc-100">
                Sign up
            </a>
        </div>
      </div>
    </form>
  );
}
