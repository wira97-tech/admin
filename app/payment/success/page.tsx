import { Suspense } from 'react';
import PaymentSuccessClient from './PaymentSuccessCLient';


export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<p>Loading...</p>}>
      <PaymentSuccessClient />
    </Suspense>
  );
}
