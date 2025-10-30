"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  TrendingUp,
  Users,
  DollarSign,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Eye,
  FileText
} from "lucide-react";
import { supabase } from "../../../lib/supabase";
import AuthGuard from "../../../components/AuthGuard";
import { AdminLayout } from "../../../components/layout/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/Card";
import { Badge } from "../../../components/ui/Badge";

interface Project {
  name: string;
}

interface Client {
  id: string;
  name: string;
  projects: Project[];
}

interface Invoice {
  id: string;
  status: "paid" | "unpaid";
  total: number;
  created_at: string;
  paid_at?: string;
  invoice_number?: string;
  clients?: {
    name: string;
  };
  invoice_items?: Array<{
    description: string;
    amount: number;
  }>;
}

interface MetricCard {
  title: string;
  value: string;
  change?: number;
  changeLabel?: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}

interface DashboardStats {
  totalRevenue: number;
  paidRevenue: number;
  unpaidRevenue: number;
  totalInvoices: number;
  paidInvoices: number;
  unpaidInvoices: number;
  totalClients: number;
  completionRate: number;
  averageInvoiceValue: number;
  monthlyGrowth: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalRevenue: 0,
    paidRevenue: 0,
    unpaidRevenue: 0,
    totalInvoices: 0,
    paidInvoices: 0,
    unpaidInvoices: 0,
    totalClients: 0,
    completionRate: 0,
    averageInvoiceValue: 0,
    monthlyGrowth: 0,
  });
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch comprehensive data like analytics page
        const { data: invoicesData, error: invoicesError } = await supabase
          .from('invoices')
          .select("*, clients(name), invoice_items(description, amount)")
          .order('created_at', { ascending: false });

        if (invoicesError) {
          console.error('Error fetching invoices:', invoicesError);
          return;
        }

        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, name, created_at, projects(id, name, description)')
          .order('created_at', { ascending: false });

        if (clientsError) {
          console.error('Error fetching clients:', clientsError);
          return;
        }

        const invoices = invoicesData || [];
        const clients = clientsData || [];

        // Calculate comprehensive stats
        const paidInvoices = invoices.filter(inv => inv.status === 'paid');
        const unpaidInvoices = invoices.filter(inv => inv.status === 'unpaid');

        const totalRevenue = invoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const paidRevenue = paidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
        const unpaidRevenue = unpaidInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);

        const completionRate = invoices.length > 0
          ? Math.round((paidInvoices.length / invoices.length) * 100)
          : 0;

        const averageInvoiceValue = invoices.length > 0
          ? Math.round(totalRevenue / invoices.length)
          : 0;

        // Calculate monthly growth (compare current month with previous month)
        const currentDate = new Date();
        const currentMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
        const previousMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1);
        const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);

        const currentMonthInvoices = invoices.filter(inv => {
          const invDate = new Date(inv.created_at);
          return invDate >= currentMonth && invDate <= nextMonth;
        });

        const previousMonthInvoices = invoices.filter(inv => {
          const invDate = new Date(inv.created_at);
          return invDate >= previousMonth && invDate < currentMonth;
        });

        const currentMonthRevenue = currentMonthInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.total || 0), 0);

        const previousMonthRevenue = previousMonthInvoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + (inv.total || 0), 0);

        const monthlyGrowth = previousMonthRevenue > 0
          ? Math.round(((currentMonthRevenue - previousMonthRevenue) / previousMonthRevenue) * 100)
          : 0;

        const dashboardStats: DashboardStats = {
          totalRevenue,
          paidRevenue,
          unpaidRevenue,
          totalInvoices: invoices.length,
          paidInvoices: paidInvoices.length,
          unpaidInvoices: unpaidInvoices.length,
          totalClients: clients.length,
          completionRate,
          averageInvoiceValue,
          monthlyGrowth,
        };

        setStats(dashboardStats);
        setInvoices(invoices);
        setClients(clients);

        console.log('Dashboard stats calculated:', {
          totalInvoices: invoices.length,
          totalClients: clients.length,
          totalRevenue,
          paidRevenue,
          completionRate
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const metrics: MetricCard[] = [
    {
      title: "Total Pendapatan",
      value: formatCurrency(stats.totalRevenue),
      change: stats.monthlyGrowth,
      changeLabel: "dari bulan lalu",
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Pendapatan Terbayar",
      value: formatCurrency(stats.paidRevenue),
      change: stats.completionRate > 0 ? stats.completionRate : undefined,
      changeLabel: stats.completionRate > 0 ? "tingkat pembayaran" : undefined,
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Total Invoice",
      value: stats.totalInvoices.toString(),
      change: stats.paidInvoices > 0 ? stats.paidInvoices : undefined,
      changeLabel: "sudah dibayar",
      icon: FileText,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
    },
    {
      title: "Total Client",
      value: stats.totalClients.toString(),
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
    },
  ];

  const recentInvoices = invoices
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5);

  return (
    <AuthGuard>
      <AdminLayout onLogout={logout}>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="mt-2 text-gray-600">Ringkasan performa bisnis Akusara Digital Agency</p>
            </div>
            <div className="flex gap-3">
              <Link href="/admin/invoices">
                <button className="inline-flex items-center px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors">
                  <Plus className="h-4 w-4 mr-2" />
                  Invoice Baru
                </button>
              </Link>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Main Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metrics.map((metric, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
                        {metric.change !== undefined && (
                          <div className="flex items-center mt-2">
                            {metric.change > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                            ) : metric.change < 0 ? (
                              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                            ) : null}
                            <span className={`text-sm ${
                              metric.change > 0 ? 'text-green-500' :
                              metric.change < 0 ? 'text-red-500' :
                              'text-gray-500'
                            }`}>
                              {metric.change !== undefined ? Math.abs(metric.change) : ''}
                              {metric.change !== undefined ? '%' : ''}
                            </span>
                            <span className="text-sm text-gray-500 ml-1">
                              {metric.changeLabel}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className={`p-3 rounded-full ${metric.bgColor}`}>
                        <metric.icon className={`h-6 w-6 ${metric.color}`} />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Additional Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Tingkat Pembayaran</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{stats.completionRate}%</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.paidInvoices} dari {stats.totalInvoices} invoice dibayar
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-blue-100">
                      <TrendingUp className="h-6 w-6 text-blue-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Rata-rata Invoice</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.averageInvoiceValue)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Nilai rata-rata per invoice
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-green-100">
                      <DollarSign className="h-6 w-6 text-green-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Menunggu Pembayaran</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{formatCurrency(stats.unpaidRevenue)}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {stats.unpaidInvoices} invoice belum dibayar
                      </p>
                    </div>
                    <div className="p-3 rounded-full bg-yellow-100">
                      <AlertCircle className="h-6 w-6 text-yellow-600" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Clients */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">Client Terbaru</CardTitle>
                  <Link href="/admin/clients">
                    <button className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      Lihat Semua
                    </button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {clients.length > 0 ? (
                      clients.map((client) => (
                        <div key={client.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center">
                            <div className="h-10 w-10 rounded-full bg-primary-100 flex items-center justify-center">
                              <span className="text-primary-600 font-medium">
                                {client.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">{client.name}</p>
                              <p className="text-sm text-gray-500">
                                {client.projects.length} project{client.projects.length !== 1 ? 's' : ''}
                              </p>
                            </div>
                          </div>
                          <Badge variant="secondary" className="text-xs">
                            Aktif
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Belum ada client</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Invoices */}
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-lg font-semibold">Invoice Terbaru</CardTitle>
                  <Link href="/admin/invoices">
                    <button className="text-primary-600 hover:text-primary-800 text-sm font-medium flex items-center">
                      <Eye className="h-4 w-4 mr-1" />
                      Lihat Semua
                    </button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentInvoices.length > 0 ? (
                      recentInvoices.map((invoice, index) => (
                        <div key={invoice.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                          <div className="flex items-center">
                            <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                              invoice.status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'
                            }`}>
                              <DollarSign className={`h-5 w-5 ${
                                invoice.status === 'paid' ? 'text-green-600' : 'text-yellow-600'
                              }`} />
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">
                                {formatCurrency(invoice.total)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {invoice.invoice_number || `INV-${invoice.id.slice(0, 8)}`}
                              </p>
                              <p className="text-xs text-gray-400">
                                {(invoice.clients as any)?.name || 'Unknown Client'}
                              </p>
                              <p className="text-xs text-gray-400">
                                {new Date(invoice.created_at).toLocaleDateString('id-ID', {
                                  day: 'numeric',
                                  month: 'short',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <Badge
                            variant={invoice.status === 'paid' ? 'success' : 'warning'}
                            className="text-xs"
                          >
                            {invoice.status === 'paid' ? 'Dibayar' : 'Menunggu'}
                          </Badge>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <p>Belum ada invoice</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Stats Summary */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg font-semibold">Ringkasan Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center">
                      <p className="text-2xl font-bold text-gray-900">{stats.totalInvoices}</p>
                      <p className="text-sm text-gray-500">Total Invoice</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-green-600">{stats.paidInvoices}</p>
                      <p className="text-sm text-gray-500">Sudah Dibayar</p>
                    </div>
                    <div className="text-center">
                      <p className="text-2xl font-bold text-yellow-600">{stats.unpaidInvoices}</p>
                      <p className="text-sm text-gray-500">Menunggu</p>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Completion Rate:</span>
                      <span className="font-medium text-gray-900">{stats.completionRate}%</span>
                    </div>
                    <div className="flex justify-between text-sm mt-1">
                      <span className="text-gray-600">Rata-rata:</span>
                      <span className="font-medium text-gray-900">{formatCurrency(stats.averageInvoiceValue)}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </AdminLayout>
    </AuthGuard>
  );
}
