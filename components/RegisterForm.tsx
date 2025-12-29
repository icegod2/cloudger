'use client';

import { useActionState, useState, useEffect } from 'react';
import { register, verifyCode, loginWithCredentials } from '@/lib/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import * as React from 'react';
import { useRouter } from 'next/navigation';

export default function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [state, dispatch, isPending] = useActionState(register, undefined);

  // Verification State
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<string | null>(null);

  const handleVerify = async (e: React.FormEvent) => {
      e.preventDefault();
      setIsVerifying(true);
      setVerifyError(null);
      
      try {
          const result = await verifyCode(email, verificationCode);
          if (result.error) {
              setVerifyError(result.error);
          } else {
              // Success! Auto login
              await loginWithCredentials(email, password);
          }
      } catch (error) {
          console.error(error);
      } finally {
          setIsVerifying(false);
      }
  };

  if (state?.success) {
      return (
          <div className="space-y-4">
              <div className="bg-emerald-50 dark:bg-emerald-900/30 p-4 rounded-xl text-center space-y-2">
                  <h3 className="text-emerald-800 dark:text-emerald-200 font-semibold text-lg">Check your email</h3>
                  <p className="text-emerald-600 dark:text-emerald-400 text-sm">
                      We have sent a verification code to <strong>{email}</strong>.
                  </p>
              </div>

              <form onSubmit={handleVerify} className="space-y-4">
                  <div className="space-y-2">
                      <Label htmlFor="code">Verification Code</Label>
                      <Input
                        id="code"
                        name="code"
                        placeholder="123456"
                        required
                        value={verificationCode}
                        onChange={(e) => setVerificationCode(e.target.value)}
                        className="rounded-xl text-center tracking-widest text-lg"
                        maxLength={6}
                      />
                  </div>
                  
                  {verifyError && (
                      <p className="text-sm text-red-500 text-center">{verifyError}</p>
                  )}

                  <Button type="submit" className="w-full rounded-full" disabled={isVerifying}>
                      {isVerifying && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Verify & Login
                  </Button>
              </form>
          </div>
      );
  }

  return (
    <form action={dispatch} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          name="name"
          placeholder="John Doe"
          required
          className="rounded-xl"
        />
        {state?.errors?.name && <p className="text-sm text-red-500">{state.errors.name}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          name="email"
          placeholder="m@example.com"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="rounded-xl"
        />
        {state?.errors?.email && <p className="text-sm text-red-500">{state.errors.email}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          name="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="rounded-xl"
        />
        {state?.errors?.password && <p className="text-sm text-red-500">{state.errors.password}</p>}
      </div>
      <div className="space-y-2">
        <Label htmlFor="confirmPassword">Confirm Password</Label>
        <Input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          required
          minLength={6}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="rounded-xl"
        />
        {state?.errors?.confirmPassword && <p className="text-sm text-red-500">{state.errors.confirmPassword}</p>}
      </div>
      <div className="flex flex-col gap-4 mt-4">
        <Button type="submit" className="w-full rounded-full" aria-disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create Account
        </Button>
        {state?.message && !state.success && (
            <p className="text-sm text-red-500 text-center">{state.message}</p>
        )}
        <div className="text-center text-sm text-zinc-500">
            Already have an account?{' '}
            <a href="/login" className="font-medium hover:underline text-zinc-900 dark:text-zinc-100">
                Log in
            </a>
        </div>
      </div>
    </form>
  );
}
