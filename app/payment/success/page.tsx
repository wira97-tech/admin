'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function PaymentSuccessPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [invoice, setInvoice] = useState<any>(null);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;

      const { data } = await supabase
        .from('invoices')
        .select('*, clients(name)')
        .eq('id', id)
        .single();

      setInvoice(data);
    };

    fetchInvoice();
  }, [id]);

  if (!invoice) return <p>Memuat...</p>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-green-600 mb-4">Pembayaran Berhasil</h1>
      <p className="mb-2">Terima kasih, {invoice.clients?.name}.</p>
      <p className="mb-2">Invoice #{invoice.id}</p>
      <p className="mb-2">Total: Rp {invoice.total}</p>
      <p className="mb-2">Berhasil dibayar!</p>
    </div>
  );
}
