'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { CheckCircle, FileText, Calendar, User, Building, Download, Mail, Phone, ArrowRight, Receipt, TrendingUp, Heart } from 'lucide-react';

interface Invoice {
  id: string;
  total: number;
  status: 'paid' | 'unpaid';
  date: string;
  paid_at?: string;
  client_id: string;
  invoice_items?: Array<{
    description: string;
    amount: number;
  }>;
  clients?: {
    name: string;
  };
}

export default function PaymentSuccessClient() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInvoice = async () => {
      if (!id) return;

      try {
        const { data } = await supabase
          .from('invoices')
          .select('*, clients(name), invoice_items(description, amount)')
          .eq('id', id)
          .single();

        setInvoice(data);
      } catch (error) {
        console.error('Error fetching invoice:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvoice();
  }, [id]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const handleDownloadReceipt = () => {
    // This would trigger PDF download - you can implement this
    window.print();
  };

  const handleContactSupport = () => {
    window.location.href = 'mailto:hello@akusara.com?subject=Payment Confirmation Inquiry';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payment confirmation...</p>
        </div>
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="h-8 w-8 text-red-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invoice Not Found</h2>
          <p className="text-gray-600">We couldn't find the payment details for this invoice.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Success Animation Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-6 relative">
            <CheckCircle className="h-12 w-12 text-green-600" />
            <div className="absolute inset-0 w-24 h-24 bg-green-100 rounded-full animate-ping opacity-20"></div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
          <p className="text-xl text-gray-600 mb-2">Thank you for your payment, {invoice.clients?.name || 'Valued Client'}</p>
          <p className="text-gray-500">Your transaction has been completed successfully</p>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Payment Confirmation Card */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
              <div className="bg-gradient-to-r from-green-600 to-green-700 p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold mb-1">Payment Confirmation</h2>
                    <p className="text-green-100">Transaction completed successfully</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-green-100">Amount Paid</p>
                    <p className="text-3xl font-bold">{formatCurrency(invoice.total)}</p>
                  </div>
                </div>
              </div>

              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Invoice Number</p>
                        <p className="font-semibold text-gray-900">#{invoice.id.slice(0, 8)}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <User className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Client Name</p>
                        <p className="font-semibold text-gray-900">{invoice.clients?.name || 'N/A'}</p>
                      </div>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Calendar className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500">Payment Date</p>
                        <p className="font-semibold text-gray-900">
                          {invoice.paid_at
                            ? new Date(invoice.paid_at).toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : new Date().toLocaleDateString('id-ID', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                              })
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <div>
                        <p className="text-sm text-gray-500">Payment Status</p>
                        <div className="flex items-center space-x-2">
                          <span className="font-semibold text-green-600">Paid in Full</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Invoice Items Summary */}
                {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                  <div className="border-t pt-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Invoice Summary</h3>
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
                      <div className="flex justify-between items-center py-4 bg-green-50 rounded-lg px-4 mt-4">
                        <span className="font-semibold text-green-900">Total Paid</span>
                        <span className="text-xl font-bold text-green-900">{formatCurrency(invoice.total)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Actions Sidebar */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {/* Quick Actions Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="space-y-3">
                  <button
                    onClick={handleDownloadReceipt}
                    className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="h-4 w-4" />
                    <span>Download Receipt</span>
                  </button>
                  <button
                    onClick={() => window.location.href = `/admin/invoices`}
                    className="w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center space-x-2"
                  >
                    <FileText className="h-4 w-4" />
                    <span>View All Invoices</span>
                  </button>
                  <button
                    onClick={handleContactSupport}
                    className="w-full border border-gray-300 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-50 transition-colors flex items-center justify-center space-x-2"
                  >
                    <Mail className="h-4 w-4" />
                    <span>Contact Support</span>
                  </button>
                </div>
              </div>

              {/* Next Steps Card */}
              <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-2xl p-6 border border-green-200">
                <div className="flex items-center space-x-3 mb-4">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                  <h3 className="text-lg font-semibold text-gray-900">What's Next?</h3>
                </div>
                <ul className="space-y-3 text-sm text-gray-600">
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>You'll receive a payment confirmation email shortly</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Your invoice status has been updated to "Paid"</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Download your receipt for future reference</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                    <span>Continue working on your project deliverables</span>
                  </li>
                </ul>
              </div>

              {/* Contact Card */}
              <div className="bg-white rounded-2xl shadow-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Need Help?</h3>
                <div className="space-y-3">
                  <a
                    href="mailto:hello@akusara.com"
                    className="flex items-center space-x-3 text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <Mail className="h-4 w-4" />
                    <span className="text-sm">hello@akusara.com</span>
                  </a>
                  <a
                    href="tel:+6281234567890"
                    className="flex items-center space-x-3 text-gray-600 hover:text-green-600 transition-colors"
                  >
                    <Phone className="h-4 w-4" />
                    <span className="text-sm">+62 812-3456-7890</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center">
          <div className="bg-white rounded-2xl shadow-lg p-8 max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <Heart className="h-5 w-5 text-red-500" />
              <span className="text-lg font-semibold text-gray-900">Thank you for your business!</span>
            </div>
            <p className="text-gray-600 mb-4">
              We appreciate your prompt payment and look forward to continuing our successful partnership.
            </p>
            <div className="flex items-center justify-center space-x-6 text-sm text-gray-500">
              <span>Akusara Digital Agency</span>
              <span>•</span>
              <span>Professional Web Solutions</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}