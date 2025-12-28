'use client';

import { useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { newVerification } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export const NewVerificationForm = () => {
  const [error, setError] = useState<string | undefined>();
  const [success, setSuccess] = useState<string | undefined>();

  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const onSubmit = useCallback(() => {
    if (success || error) return;

    if (!token) {
      setError('Missing token!');
      return;
    }

    newVerification(token)
      .then((data) => {
        setSuccess(data.success);
        setError(data.error);
      })
      .catch(() => {
        setError('Something went wrong!');
      });
  }, [token, success, error]);

  useEffect(() => {
    onSubmit();
  }, [onSubmit]);

  return (
    <Card className="w-full max-w-[400px] shadow-md">
      <CardHeader>
        <CardTitle className="text-2xl font-bold text-center">Confirming your verification</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-center gap-4">
        {!success && !error && (
           <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
        )}
        
        {success && (
           <div className="p-3 bg-emerald-100 text-emerald-500 rounded-md text-sm w-full text-center">
             {success}
           </div>
        )}

        {error && (
           <div className="p-3 bg-rose-100 text-rose-500 rounded-md text-sm w-full text-center">
             {error}
           </div>
        )}

        <Link href="/login" className="w-full">
            <Button variant="outline" className="w-full">Back to Login</Button>
        </Link>
      </CardContent>
    </Card>
  );
};
