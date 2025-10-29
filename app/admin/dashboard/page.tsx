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
  status: "paid" | "unpaid";
  amount: number;
  created_at: string;
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

export default function DashboardPage() {
  const [summary, setSummary] = useState({ total: 0, paid: 0, unpaid: 0 });
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

      // Fetch summary data
      const { data: invoiceData } = await supabase.from("invoices").select("status, amount, created_at");
      let total = 0, paid = 0, unpaid = 0;

      if (invoiceData) {
        invoiceData?.forEach((inv: Invoice) => {
          total += inv.amount;
          if (inv.status === "paid") paid += inv.amount;
          else unpaid += inv.amount;
        });
        setSummary({ total, paid, unpaid });
        setInvoices(invoiceData);
      }

      // Fetch recent clients
      const { data: clientData } = await supabase
        .from("clients")
        .select("id, name, projects(name)")
        .order("name")
        .limit(5);

      if (clientData) setClients(clientData);

      setLoading(false);
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
      value: formatCurrency(summary.total),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      title: "Terbayar",
      value: formatCurrency(summary.paid),
      icon: TrendingUp,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Menunggu Pembayaran",
      value: formatCurrency(summary.unpaid),
      icon: AlertCircle,
      color: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      title: "Total Client",
      value: clients.length.toString(),
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
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {metrics.map((metric, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">{metric.title}</p>
                        <p className="text-2xl font-bold text-gray-900 mt-2">{metric.value}</p>
                        {metric.change && (
                          <div className="flex items-center mt-2">
                            {metric.change > 0 ? (
                              <ArrowUpRight className="h-4 w-4 text-green-500 mr-1" />
                            ) : (
                              <ArrowDownRight className="h-4 w-4 text-red-500 mr-1" />
                            )}
                            <span className={`text-sm ${metric.change > 0 ? 'text-green-500' : 'text-red-500'}`}>
                              {Math.abs(metric.change)}%
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
                        <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
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
                                {formatCurrency(invoice.amount)}
                              </p>
                              <p className="text-sm text-gray-500">
                                {new Date(invoice.created_at).toLocaleDateString('id-ID')}
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
            </div>
          </>
        )}
      </AdminLayout>
    </AuthGuard>
  );
}
