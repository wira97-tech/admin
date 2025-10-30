"use client";

import { use, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { CheckCircle, Clock, AlertCircle, CreditCard, Calendar, User, Building, FileText, Shield, ArrowLeft } from "lucide-react";

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
  invoice_items?: Array<{
    description: string;
    amount: number;
  }>;
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
  const [processing, setProcessing] = useState(false);
  const { id } = use(params);

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const { data } = await supabase
          .from("invoices")
          .select("*, clients(name), invoice_items(description, amount)")
          .eq("id", id)
          .single();

        if (data?.status === "paid") {
          window.location.href = `/payment/success?id=${data.id}`;
          return;
        }
        setInvoice(data);
      } catch (error) {
        console.error("Error fetching invoice:", error);
      } finally {
        setLoading(false);
      }
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
      if (document.body.contains(script)) {
        document.body.removeChild(script);
      }
    };
  }, []);

  const handlePayment = async () => {
    if (!invoice) return;

    setProcessing(true);
    try {
      const res = await fetch(`/api/payment?id=${invoice.id}`);
      const data = await res.json();

      if (!data.token) {
        console.error("Token Midtrans tidak ditemukan:", data);
        alert("Gagal mendapatkan token pembayaran");
        setProcessing(false);
        return;
      }

      window.snap.pay(data.token, {
        onSuccess: async function (result: MidtransResult) {
          console.log("Pembayaran sukses", result);

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
            setProcessing(false);
          }
        },
        onPending: function (result: MidtransResult) {
          console.log("Menunggu pembayaran", result);
          setProcessing(false);
        },
        onError: function (result: MidtransResult) {
          console.log("Pembayaran gagal", result);
          alert("Terjadi kesalahan saat pembayaran.");
          setProcessing(false);
        },
        onClose: function () {
          console.log("Snap ditutup tanpa menyelesaikan pembayaran");
          setProcessing(false);
        },
      });
    } catch (err) {
      console.error("Gagal fetch token:", err);
      alert("Terjadi kesalahan saat memproses pembayaran.");
      setProcessing(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Memuat data invoice...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Tidak Ditemukan</h2>
          <p className="text-gray-600 mb-6">Invoice yang Anda cari tidak ada atau telah dihapus.</p>
          <button
            onClick={() => window.history.back()}
            className="bg-gray-600 text-white px-6 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            Kembali
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <FileText className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Portal</h1>
          <p className="text-gray-600">Secure payment processing for your invoice</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Payment Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              {/* Invoice Header */}
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Invoice #{invoice.id.slice(0, 8)}</h2>
                    <p className="text-green-100">Due upon receipt</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-100">Total Amount</p>
                    <p className="text-3xl font-bold">{formatCurrency(invoice.total)}</p>
                  </div>
                </div>
              </div>

              {/* Invoice Details */}
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Bill To</p>
                        <p className="font-semibold text-gray-900">{invoice.clients?.name || 'Unknown Client'}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Invoice Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(invoice.date).toLocaleDateString('id-ID', {
                            day: 'numeric',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Status</p>
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-yellow-500" />
                          <span className="font-semibold text-yellow-600">Pending Payment</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CreditCard className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Payment Method</p>
                        <p className="font-semibold text-gray-900">Secure Online Payment</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Items */}
                {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Details</h3>
                    <div className="space-y-3">
                      {invoice.invoice_items.map((item, index) => (
                        <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100">
                          <div>
                            <p className="font-medium text-gray-900">{item.description}</p>
                            <p className="text-sm text-gray-500">Item {index + 1}</p>
                          </div>
                          <p className="font-semibold text-gray-900">{formatCurrency(item.amount)}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Payment Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-xl p-6 sticky top-8">
              <div className="text-center mb-6">
                <Shield className="h-12 w-12 text-green-600 mx-auto mb-3" />
                <h3 className="text-lg font-semibold text-gray-900">Secure Payment</h3>
                <p className="text-sm text-gray-600">Your payment information is encrypted and secure</p>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Subtotal</span>
                  <span className="font-semibold">{formatCurrency(invoice.total)}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm text-gray-600">Tax</span>
                  <span className="font-semibold">{formatCurrency(0)}</span>
                </div>
                <div className="flex justify-between items-center p-4 bg-green-50 rounded-lg border-2 border-green-200">
                  <span className="font-semibold text-green-900">Total</span>
                  <span className="text-xl font-bold text-green-900">{formatCurrency(invoice.total)}</span>
                </div>
              </div>

              <button
                onClick={handlePayment}
                disabled={processing}
                className="w-full bg-gradient-to-r from-green-600 to-green-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                {processing ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5" />
                    <span>Pay Now</span>
                  </>
                )}
              </button>

              <div className="mt-6 text-center">
                <p className="text-xs text-gray-500 mb-2">
                  By clicking "Pay Now", you agree to our terms and conditions
                </p>
                <div className="flex items-center justify-center space-x-4 text-xs text-gray-400">
                  <div className="flex items-center space-x-1">
                    <Shield className="h-3 w-3" />
                    <span>SSL Secured</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <CheckCircle className="h-3 w-3" />
                    <span>Safe Checkout</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-600">
          <p>Questions about this invoice? Contact our support team</p>
          <p className="mt-2">
            Email: hello@akusara.com | Phone: +62 812-3456-7890
          </p>
        </div>
      </div>
    </div>
  );
}
