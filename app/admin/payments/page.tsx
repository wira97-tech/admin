"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import AnalyticsChart from '@/components/charts/AnalyticsChart';
import MetricCard from '@/components/charts/MetricCard';
import DateRangePicker from '@/components/charts/DateRangePicker';
import {
  CreditCard,
  Search,
  Filter,
  Download,
  Eye,
  RefreshCw,
  DollarSign,
  TrendingUp,
  Users,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from 'lucide-react';
import { format, subDays, subMonths } from 'date-fns';

interface Payment {
  id: string;
  invoice_id: string;
  invoice_number: string;
  client_name: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed' | 'refunded';
  payment_method: string;
  transaction_id?: string;
  created_at: string;
  paid_at?: string;
  failure_reason?: string;
  invoice_items?: Array<{
    description: string;
    amount: number;
  }>;
}

interface PaymentAnalytics {
  overview: {
    totalRevenue: number;
    pendingPayments: number;
    failedPayments: number;
    refundAmount: number;
    averageTransactionValue: number;
    successRate: number;
  };
  paymentTrend: Array<{
    date: string;
    revenue: number;
    transactions: number;
    successRate: number;
  }>;
  paymentMethods: Array<{
    method: string;
    count: number;
    amount: number;
    successRate: number;
  }>;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [analytics, setAnalytics] = useState<PaymentAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState({
    start: subMonths(new Date(), 3),
    end: new Date(),
  });
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  useEffect(() => {
    fetchPayments();
    fetchAnalytics();
  }, [dateRange, statusFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      // Use same query as invoices page
      const { data, error } = await supabase
        .from('invoices')
        .select("*, clients(name), invoice_items(description, amount)")
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching payments:', error);
        return;
      }

      const formattedPayments: Payment[] = data?.map(invoice => ({
        id: invoice.id,
        invoice_id: invoice.id,
        invoice_number: invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`,
        client_name: (invoice.clients as any)?.name || 'Unknown',
        amount: invoice.total,
        status: invoice.status === 'paid' ? 'paid' : 'pending' as Payment['status'],
        payment_method: invoice.payment_method || 'Bank Transfer',
        transaction_id: invoice.transaction_id || invoice.id,
        created_at: invoice.created_at,
        paid_at: invoice.paid_at,
        failure_reason: invoice.failure_reason,
      })) || [];

      console.log('Payments fetched:', formattedPayments.length);
      setPayments(formattedPayments);
    } catch (error) {
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      // Calculate analytics from the same data
      const { data: invoicesData, error: invoicesError } = await supabase
        .from('invoices')
        .select("*, clients(name), invoice_items(description, amount)")
        .gte('created_at', dateRange.start.toISOString())
        .lte('created_at', dateRange.end.toISOString())
        .order('created_at', { ascending: false });

      if (invoicesError) {
        console.error('Error fetching invoice analytics:', invoicesError);
        return;
      }

      const invoices = invoicesData || [];
      const paidInvoices = invoices.filter(inv => inv.status === 'paid');
      const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');

      const totalRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
      const pendingPayments = unpaidInvoices.length;
      const failedPayments = 0; // No failed status in current schema
      const refundAmount = 0; // No refunds in current schema
      const averageTransactionValue = paidInvoices.length > 0
        ? totalRevenue / paidInvoices.length
        : 0;
      const successRate = invoices.length > 0
        ? (paidInvoices.length / invoices.length) * 100
        : 0;

      // Generate daily payment trend (last 30 days)
      const paymentTrend = [];
      const currentDate = new Date();

      for (let i = 29; i >= 0; i--) {
        const date = new Date(currentDate);
        date.setDate(date.getDate() - i);
        const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
        const dateEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1);

        const dayInvoices = invoices.filter(inv => {
          const invDate = new Date(inv.created_at);
          return invDate >= dateStart && invDate < dateEnd;
        });

        const dayPaid = dayInvoices.filter(inv => inv.status === 'paid');
        const dayRevenue = dayPaid.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const daySuccessRate = dayInvoices.length > 0
          ? (dayPaid.length / dayInvoices.length) * 100
          : 0;

        paymentTrend.push({
          date: dateStart.toISOString().slice(0, 10),
          revenue: dayRevenue,
          transactions: dayInvoices.length,
          successRate: Math.round(daySuccessRate * 10) / 10,
        });
      }

      // Payment methods breakdown (estimated)
      const paymentMethods = [];
      if (paidInvoices.length > 0) {
        const methodCounts = invoices.reduce((acc, invoice) => {
          let method = 'Bank Transfer'; // Default
          if (invoice.total && invoice.total > 10000000) {
            method = 'Credit Card';
          } else if (invoice.total && invoice.total < 1000000) {
            method = 'E-Wallet';
          }

          if (!acc[method]) {
            acc[method] = { count: 0, amount: 0, successCount: 0 };
          }
          acc[method].count++;
          acc[method].amount += invoice.total || 0;
          if (invoice.status === 'paid') {
            acc[method].successCount++;
          }
          return acc;
        }, {} as Record<string, { count: number; amount: number; successCount: number }>);

        Object.entries(methodCounts).forEach(([method, data]) => {
          paymentMethods.push({
            method,
            count: data.count,
            amount: data.amount,
            successRate: data.count > 0 ? (data.successCount / data.count) * 100 : 0,
          });
        });
      }

      const analyticsData = {
        overview: {
          totalRevenue,
          pendingPayments,
          failedPayments,
          refundAmount,
          averageTransactionValue: Math.round(averageTransactionValue),
          successRate: Math.round(successRate * 10) / 10,
        },
        paymentTrend,
        paymentMethods,
      };

      console.log('Payment analytics generated:', {
        totalInvoices: invoices.length,
        paidInvoices: paidInvoices.length,
        totalRevenue
      });

      setAnalytics(analyticsData);
    } catch (error) {
      console.error('Error fetching payment analytics:', error);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch =
      payment.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.client_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.transaction_id?.toLowerCase().includes(searchTerm.toLowerCase());

    // Convert status for filtering
    const paymentStatus = payment.status === 'pending' ? 'unpaid' : payment.status;
    const matchesStatus = statusFilter === 'all' || paymentStatus === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800';
      case 'pending': // unpaid
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'refunded':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Payment['status']) => {
    switch (status) {
      case 'paid':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending': // unpaid
        return <Clock className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'refunded':
        return <RefreshCw className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailModal(true);
  };

  // Use empty default if no data available
  const defaultAnalytics: PaymentAnalytics = {
    overview: {
      totalRevenue: 0,
      pendingPayments: 0,
      failedPayments: 0,
      refundAmount: 0,
      averageTransactionValue: 0,
      successRate: 0,
    },
    paymentTrend: [],
    paymentMethods: [],
  };

  const analyticsData = analytics || defaultAnalytics;

  return (
    <AuthGuard>
      <AdminLayout onLogout={logout}>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Payment Management</h1>
              <p className="mt-2 text-gray-600">
                Track and manage all payment transactions
              </p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-3">
              <DateRangePicker
                value={dateRange}
                onChange={setDateRange}
              />
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Overview Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <MetricCard
              title="Total Revenue"
              value={analyticsData.overview.totalRevenue}
              icon={DollarSign}
              color="green"
              description="From successful payments"
            />
            <MetricCard
              title="Pending Payments"
              value={analyticsData.overview.pendingPayments}
              icon={Clock}
              color="yellow"
              description="Awaiting payment"
            />
            <MetricCard
              title="Success Rate"
              value={`${analyticsData.overview.successRate}%`}
              icon={TrendingUp}
              color="green"
              description="Payment completion rate"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="p-6">
              <AnalyticsChart
                type="area"
                data={analyticsData.paymentTrend}
                xAxisKey="date"
                yAxisKey="revenue"
                title="Payment Revenue Trend"
                height={300}
                color="#10b981"
                formatXAxis={true}
                formatYAxis={true}
              />
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Payment Methods
              </h3>
              <div className="space-y-4">
                {analyticsData.paymentMethods.map((method, index) => (
                  <div key={method.method} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <CreditCard className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {method.method}
                        </div>
                        <div className="text-xs text-gray-500">
                          {method.count} transactions
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-gray-900">
                        {new Intl.NumberFormat('id-ID', {
                          style: 'currency',
                          currency: 'IDR',
                          minimumFractionDigits: 0,
                        }).format(method.amount)}
                      </div>
                      <div className="text-xs text-gray-500">
                        {method.successRate}% success
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Payment Table */}
          <Card className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 sm:mb-0">
                Transaction History
              </h3>
              <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search transactions..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                </select>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Invoice
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Method
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.invoice_number}
                          </div>
                          {payment.transaction_id && (
                            <div className="text-xs text-gray-500">
                              ID: {payment.transaction_id}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.client_name}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          }).format(payment.amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {payment.payment_method}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <Badge className={getStatusColor(payment.status)}>
                            <div className="flex items-center space-x-1">
                              {getStatusIcon(payment.status)}
                              <span className="capitalize">{payment.status}</span>
                            </div>
                          </Badge>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(payment.created_at), 'MMM d, yyyy')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewDetails(payment)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {filteredPayments.length === 0 && (
                  <div className="text-center py-12">
                    <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No transactions</h3>
                    <p className="mt-1 text-sm text-gray-500">
                      No payment transactions found for the selected criteria.
                    </p>
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Payment Detail Modal */}
          {showDetailModal && selectedPayment && (
            <div className="fixed inset-0 z-50 overflow-y-auto">
              <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowDetailModal(false)} />
                <div className="relative bg-white rounded-lg max-w-2xl w-full p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-medium text-gray-900">
                      Payment Details
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowDetailModal(false)}
                    >
                      ×
                    </Button>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Invoice Number</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPayment.invoice_number}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Status</label>
                        <Badge className={`mt-1 ${getStatusColor(selectedPayment.status)}`}>
                          <div className="flex items-center space-x-1">
                            {getStatusIcon(selectedPayment.status)}
                            <span className="capitalize">{selectedPayment.status}</span>
                          </div>
                        </Badge>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Client</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPayment.client_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {new Intl.NumberFormat('id-ID', {
                            style: 'currency',
                            currency: 'IDR',
                            minimumFractionDigits: 0,
                          }).format(selectedPayment.amount)}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                        <p className="mt-1 text-sm text-gray-900">{selectedPayment.payment_method}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Transaction ID</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {selectedPayment.transaction_id || 'Not available'}
                        </p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Created Date</label>
                        <p className="mt-1 text-sm text-gray-900">
                          {format(new Date(selectedPayment.created_at), 'MMM d, yyyy HH:mm')}
                        </p>
                      </div>
                      {selectedPayment.paid_at && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700">Paid Date</label>
                          <p className="mt-1 text-sm text-gray-900">
                            {format(new Date(selectedPayment.paid_at), 'MMM d, yyyy HH:mm')}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedPayment.failure_reason && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Failure Reason</label>
                        <p className="mt-1 text-sm text-red-600">{selectedPayment.failure_reason}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}