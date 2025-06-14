"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

declare global {
  interface Window {
    snap: {
      pay: (
        token: string,
        callbacks: {
          onSuccess?: (result: MidtransResult) => void;
          onPending?: (result: MidtransResult) => void;
          onError?: (result: MidtransResult) => void;
          onClose?: () => void;
        }
      ) => void;
    };
  }
}


interface InvoiceWithClient {
  id: string;
  client_id: string;
  date: string;
  total: number;
  status: "paid" | "unpaid";
  clients?: {
    name: string;
  };
}

interface MidtransResult {
  transaction_id: string;
  order_id: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  transaction_status: string;
  fraud_status?: string;
  status_message?: string;
}



export default function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const [invoice, setInvoice] = useState<InvoiceWithClient | null>(null);
  const [loading, setLoading] = useState(true);
  const { id } = use(params); // unwrap promise

  useEffect(() => {
    const fetchInvoice = async () => {
      const { data } = await supabase
        .from("invoices")
        .select("*, clients(name)")
        .eq("id", id)
        .single();
      if (data?.status === "paid") {
        window.location.href = `/payment/success?id=${data.id}`;
        return;
      }
      setInvoice(data);
      setLoading(false);
    };

    fetchInvoice();
  }, [id]);

  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";
    script.setAttribute(
      "data-client-key",
      process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY!
    );
    script.async = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  const handlePayment = async () => {
    if (!invoice) return;
    try {
      const res = await fetch(`/api/payment?id=${invoice.id}`);
      const data = await res.json();
      console.log(data);

      if (!data.token) {
        console.error("Token Midtrans tidak ditemukan:", data);
        alert("Gagal mendapatkan token pembayaran");
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: async function (result: MidtransResult) {
          console.log("Pembayaran sukses", result);

          // Update status invoice ke "paid"
          const updateRes = await fetch("/api/paid-status", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: invoice.id,
              status: "paid",
            }),
          });

          const updateData = await updateRes.json();

          if (updateData.success) {
            window.location.href = `/payment/success?id=${invoice.id}`;
          } else {
            console.error("Gagal update status:", updateData);
            alert("Pembayaran berhasil tapi gagal update status.");
          }
        },
        onPending: function (result: MidtransResult) {
          console.log("Menunggu pembayaran", result);
        },
        onError: function (result: MidtransResult) {
          console.log("Pembayaran gagal", result);
          alert("Terjadi kesalahan saat pembayaran.");
        },
        onClose: function () {
          console.log("Snap ditutup tanpa menyelesaikan pembayaran");
        },
      });
    } catch (err) {
      console.error("Gagal fetch token:", err);
      alert("Terjadi kesalahan saat memproses pembayaran.");
    }
  };

  if (loading) return <p>Memuat...</p>;
  if (!invoice) return <p>Invoice tidak ditemukan.</p>;

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Pembayaran Invoice</h1>
      <p className="mb-2">Client: {invoice.clients?.name}</p>
      <p className="mb-2">Total: Rp {invoice.total}</p>
      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mt-4"
        onClick={handlePayment}
      >
        Bayar Sekarang
      </button>
    </div>
  );
}
