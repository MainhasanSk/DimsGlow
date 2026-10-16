import { Suspense } from 'react';
import { OrderSuccessClient } from './OrderSuccessClient';

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#FAF8FA] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-[#B83B63] border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <OrderSuccessClient />
    </Suspense>
  );
}
