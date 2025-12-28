import { NewVerificationForm } from "@/components/NewVerificationForm";
import { Suspense } from "react";

export default function NewVerificationPage() {
  return (
    <div className="flex h-screen items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4">
      <Suspense fallback={<div>Loading...</div>}>
        <NewVerificationForm />
      </Suspense>
    </div>
  );
}
