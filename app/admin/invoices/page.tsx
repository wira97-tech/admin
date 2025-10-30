"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Download,
  Trash2,
  FileText,
  DollarSign,
  Calendar,
  User,
  Filter,
  Eye,
  Edit,
  CheckCircle,
  Clock,
  AlertCircle,
  X
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AuthGuard from "@/components/AuthGuard";
import { AdminLayout } from "@/components/layout/AdminLayout";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { Badge } from "@/components/ui/Badge";
import { Textarea } from "@/components/ui/Textarea";

interface Client {
  id: string;
  name: string;
}

interface InvoiceItem {
  id?: string;
  description: string;
  amount: number;
}

interface InvoiceWithClient {
  id: string;
  client_id: string;
  date: string;
  total: number;
  status: "paid" | "unpaid";
  created_at: string;
  clients?: {
    name: string;
  };
  invoice_items?: InvoiceItem[];
}

export default function InvoicesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", amount: 0 }]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "paid" | "unpaid">("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState<InvoiceWithClient | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingInvoices, setLoadingInvoices] = useState(true);
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  useEffect(() => {
    fetchClients();
    fetchInvoices();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, name").order("name");
    if (data) setClients(data);
  };

  const fetchInvoices = async () => {
    setLoadingInvoices(true);
    const { data } = await supabase
      .from("invoices")
      .select("*, clients(name), invoice_items(description, amount)")
      .order("created_at", { ascending: false });
    if (data) setInvoices(data);
    setLoadingInvoices(false);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string
  ) => {
    const newItems = [...items];
    if (field === "amount") {
      newItems[index].amount = parseFloat(value) || 0;
    } else {
      newItems[index].description = value;
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: "", amount: 0 }]);

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const resetForm = () => {
    setSelectedClient("");
    setItems([{ description: "", amount: 0 }]);
    setShowCreateModal(false);
  };

  const createInvoice = async () => {
    if (!selectedClient || items.some(item => !item.description || item.amount <= 0)) {
      alert("Mohon lengkapi semua field dengan benar");
      return;
    }

    setLoading(true);
    try {
      const total = items.reduce((sum, item) => sum + item.amount, 0);
      const { data: invoice } = await supabase
        .from("invoices")
        .insert({
          client_id: selectedClient,
          date: new Date(),
          total,
          status: 'unpaid'
        })
        .select()
        .single();

      if (invoice) {
        await Promise.all(
          items.map((item) =>
            supabase.from("invoice_items").insert({
              invoice_id: invoice.id,
              description: item.description,
              amount: item.amount,
            })
          )
        );
        resetForm();
        fetchInvoices();
      }
    } catch (error) {
      console.error("Error creating invoice:", error);
      alert("Gagal membuat invoice. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const deleteInvoice = async () => {
    if (!confirmDelete) return;

    setLoading(true);
    try {
      const { data: inv } = await supabase
        .from("invoices")
        .select("status")
        .eq("id", confirmDelete)
        .single();

      if (inv?.status === "paid") {
        alert("Invoice sudah dibayar dan tidak bisa dihapus.");
        setConfirmDelete(null);
        setLoading(false);
        return;
      }

      await supabase.from("invoice_items").delete().eq("invoice_id", confirmDelete);
      await supabase.from("invoices").delete().eq("id", confirmDelete);
      setConfirmDelete(null);
      fetchInvoices();
    } catch (error) {
      console.error("Error deleting invoice:", error);
      alert("Gagal menghapus invoice. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  const generatePDF = async (invoice: InvoiceWithClient) => {
    try {
      const { data: items } = await supabase
        .from("invoice_items")
        .select("description, amount")
        .eq("invoice_id", invoice.id);

      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.width;

      // Define colors
      const primaryColor = [16, 185, 129]; // green-500
      const lightGray = [245, 245, 245]; // gray-100
      const darkGray = [31, 41, 55]; // gray-800

      // Header Section with Background
      doc.setFillColor(...primaryColor);
      doc.rect(0, 0, pageWidth, 60, 'F');

      // Company Info (Left side of header)
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont(undefined, 'bold');
      doc.text("INVOICE", 14, 25);

      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');
      doc.text("Akusara Digital Agency", 14, 35);
      doc.text("Jl. Sesetan No.1 Denpasar, Bali Indonesia", 14, 42);
      doc.text("Email: hello@akusara.com | Phone: +62 812-3456-7890", 14, 49);

      // Invoice Details (Right side of header)
      doc.setFontSize(12);
      doc.text(`Invoice #: INV-${invoice.id}`, 120, 25);
      doc.text(`Date: ${new Date(invoice.date).toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      })}`, 120, 35);

      // Status Badge
      const statusX = 120;
      const statusY = 45;
      const statusWidth = 30;
      const statusHeight = 8;

      if (invoice.status === 'paid') {
        doc.setFillColor(34, 197, 94); // green-500
        doc.rect(statusX, statusY, statusWidth, statusHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('PAID', statusX + 15, statusY + 5, { align: 'center' });
      } else {
        doc.setFillColor(251, 146, 60); // orange-400
        doc.rect(statusX, statusY, statusWidth, statusHeight, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text('PENDING', statusX + 15, statusY + 5, { align: 'center' });
      }

      // Bill To Section
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("Bill To:", 14, 80);

      doc.setFontSize(12);
      doc.setFont(undefined, 'normal');
      doc.text(invoice.clients?.name || 'Unknown Client', 14, 88);
      doc.text("Client of Akusara Digital Agency", 14, 95);

      // Invoice Items Table
      const tableStartY = 110;

      autoTable(doc, {
        startY: tableStartY,
        head: [
          [
            { content: 'Description', styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' } },
            { content: 'Quantity', styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' }, halign: 'center' },
            { content: 'Unit Price', styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' }, halign: 'right' },
            { content: 'Amount', styles: { fillColor: primaryColor, textColor: 255, fontStyle: 'bold' }, halign: 'right' }
          ]
        ],
        body: (items || []).map((item, index) => [
          item.description || "",
          "1", // Assuming quantity is always 1 for now
          `Rp ${item.amount.toLocaleString('id-ID')}`,
          `Rp ${item.amount.toLocaleString('id-ID')}`
        ]),
        theme: 'grid',
        styles: {
          fontSize: 10,
          cellPadding: 8,
          lineColor: [200, 200, 200]
        },
        alternateRowStyles: {
          fillColor: lightGray
        },
        headStyles: {
          fillColor: primaryColor,
          textColor: 255,
          fontStyle: 'bold',
          cellPadding: 10
        },
        columnStyles: {
          0: { cellWidth: 'auto' },
          1: { cellWidth: 30, halign: 'center' },
          2: { cellWidth: 50, halign: 'right' },
          3: { cellWidth: 50, halign: 'right' }
        }
      });

      const finalY = (doc as any).lastAutoTable?.finalY ?? tableStartY + 50;

      // Summary Section
      const summaryStartY = finalY + 20;

      // Summary Box
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.rect(130, summaryStartY - 10, 60, 80);

      // Summary Items
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'normal');

      const subtotal = invoice.total;
      const tax = 0; // You can calculate tax if needed
      const total = subtotal + tax;

      doc.text("Subtotal:", 135, summaryStartY);
      doc.text(`Rp ${subtotal.toLocaleString('id-ID')}`, 175, summaryStartY, { align: 'right' });

      if (tax > 0) {
        doc.text("Tax (10%):", 135, summaryStartY + 12);
        doc.text(`Rp ${tax.toLocaleString('id-ID')}`, 175, summaryStartY + 12, { align: 'right' });
      }

      // Total Line
      doc.setDrawColor(...primaryColor);
      doc.setLineWidth(1);
      doc.line(135, summaryStartY + 20, 185, summaryStartY + 20);

      doc.setFontSize(14);
      doc.setFont(undefined, 'bold');
      doc.text("TOTAL:", 135, summaryStartY + 32);
      doc.text(`Rp ${total.toLocaleString('id-ID')}`, 175, summaryStartY + 32, { align: 'right' });

      // Payment Information
      const paymentStartY = summaryStartY + 60;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
      doc.setFont(undefined, 'bold');
      doc.text("Payment Information:", 14, paymentStartY);

      doc.setFont(undefined, 'normal');
      doc.text("Bank: BCA (Bank Central Asia)", 14, paymentStartY + 8);
      doc.text("Account Name: Akusara Digital Agency", 14, paymentStartY + 16);
      doc.text("Account Number: 123-456-7890", 14, paymentStartY + 24);

      // Payment Status
      if (invoice.status === 'paid') {
        doc.setTextColor(34, 197, 94); // green
        doc.setFont(undefined, 'bold');
        doc.text("✓ Payment Completed", 14, paymentStartY + 36);

        if (invoice.paid_at) {
          doc.setFont(undefined, 'normal');
          doc.text(`Paid on: ${new Date(invoice.paid_at).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          })}`, 14, paymentStartY + 44);
        }
      } else {
        doc.setTextColor(251, 146, 60); // orange
        doc.setFont(undefined, 'bold');
        doc.text("⏳ Awaiting Payment", 14, paymentStartY + 36);

        // Payment Link
        const paymentUrl = `${window.location.origin}/payment/${invoice.id}`;
        doc.setTextColor(16, 185, 129); // green
        doc.setFont(undefined, 'normal');
        doc.textWithLink('Click here to pay', 14, paymentStartY + 44, { url: paymentUrl });
      }

      // Footer
      const footerY = 270;

      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.5);
      doc.line(14, footerY, pageWidth - 14, footerY);

      doc.setTextColor(100, 100, 100);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      doc.text("Thank you for your business!", 14, footerY + 8);
      doc.text("This is a computer-generated invoice and does not require a signature.", 14, footerY + 14);
      doc.text(`Page 1 of 1`, pageWidth - 14, footerY + 14, { align: 'right' });

      // Add page border
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(1);
      doc.rect(5, 5, pageWidth - 10, 287);

      doc.save(`invoice-${invoice.id}.pdf`);
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("Gagal generate PDF. Silakan coba lagi.");
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredInvoices = invoices.filter((invoice) => {
    const matchesSearch = invoice.clients?.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || invoice.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const calculateTotal = () => {
    return items.reduce((sum, item) => sum + item.amount, 0);
  };

  return (
    <AuthGuard>
      <AdminLayout onLogout={logout}>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Invoices</h1>
              <p className="mt-2 text-gray-600">Kelola invoice dan pembayaran client</p>
            </div>
            <Button onClick={() => setShowCreateModal(true)} className="inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Invoice Baru
            </Button>
          </div>
        </div>

        {/* Search and Filter */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  type="text"
                  placeholder="Cari invoice berdasarkan nama client..."
                  className="pl-10"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === "all" ? "default" : "outline"}
                  onClick={() => setStatusFilter("all")}
                  className="flex items-center"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  Semua
                </Button>
                <Button
                  variant={statusFilter === "unpaid" ? "default" : "outline"}
                  onClick={() => setStatusFilter("unpaid")}
                  className="flex items-center"
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Menunggu
                </Button>
                <Button
                  variant={statusFilter === "paid" ? "default" : "outline"}
                  onClick={() => setStatusFilter("paid")}
                  className="flex items-center"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Dibayar
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {loadingInvoices ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Invoices Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {filteredInvoices.map((invoice) => (
                <Card key={invoice.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`h-12 w-12 rounded-full flex items-center justify-center ${
                          invoice.status === 'paid' ? 'bg-green-100' : 'bg-yellow-100'
                        }`}>
                          {invoice.status === 'paid' ? (
                            <CheckCircle className="h-6 w-6 text-green-600" />
                          ) : (
                            <Clock className="h-6 w-6 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <CardTitle className="text-lg">INV/{invoice.id}</CardTitle>
                          <p className="text-sm text-gray-500">
                            {new Date(invoice.date).toLocaleDateString('id-ID')}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setShowPreviewModal(invoice)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => generatePDF(invoice)}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        {invoice.status === 'unpaid' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setConfirmDelete(invoice.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {invoice.clients?.name}
                        </div>
                        <Badge
                          variant={invoice.status === 'paid' ? 'success' : 'warning'}
                        >
                          {invoice.status === 'paid' ? 'Dibayar' : 'Menunggu'}
                        </Badge>
                      </div>
                      <div className="pt-3 border-t">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500">Total:</span>
                          <span className="text-lg font-semibold text-gray-900">
                            {formatCurrency(invoice.total)}
                          </span>
                        </div>
                      </div>
                      {invoice.invoice_items && invoice.invoice_items.length > 0 && (
                        <div className="pt-2">
                          <p className="text-xs text-gray-500 mb-1">
                            {invoice.invoice_items.length} item{invoice.invoice_items.length !== 1 ? 's' : ''}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredInvoices.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {search || statusFilter !== "all" ? 'Tidak ada invoice ditemukan' : 'Belum ada invoice'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {search || statusFilter !== "all"
                      ? 'Coba ubah filter atau kata kunci pencarian'
                      : 'Buat invoice pertama Anda untuk memulai'
                    }
                  </p>
                  {!search && statusFilter === "all" && (
                    <Button onClick={() => setShowCreateModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Invoice Baru
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Create Invoice Modal */}
        <Modal
          isOpen={showCreateModal}
          onClose={resetForm}
          title="Invoice Baru"
          size="lg"
        >
          <div className="space-y-6">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pilih Client *
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                value={selectedClient}
                onChange={(e) => setSelectedClient(e.target.value)}
              >
                <option value="">Pilih Client</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Invoice Items */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">Invoice Items</h3>
                <Button variant="outline" size="sm" onClick={addItem}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Item
                </Button>
              </div>
              <div className="space-y-3">
                {items.map((item, index) => (
                  <Card key={index} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Item {index + 1}</h4>
                        {items.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        <div className="md:col-span-2">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Deskripsi *
                          </label>
                          <Input
                            type="text"
                            placeholder="Deskripsi item"
                            value={item.description}
                            onChange={(e) => handleItemChange(index, "description", e.target.value)}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Jumlah (Rp) *
                          </label>
                          <Input
                            type="number"
                            placeholder="0"
                            value={item.amount}
                            onChange={(e) => handleItemChange(index, "amount", e.target.value)}
                          />
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="border-t pt-4">
              <div className="flex items-center justify-between">
                <span className="text-lg font-medium text-gray-900">Total:</span>
                <span className="text-2xl font-bold text-primary-600">
                  {formatCurrency(calculateTotal())}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>
                Batal
              </Button>
              <Button
                onClick={createInvoice}
                disabled={loading || !selectedClient || items.some(item => !item.description || item.amount <= 0)}
              >
                {loading ? "Menyimpan..." : "Buat Invoice"}
              </Button>
            </div>
          </div>
        </Modal>

        {/* Invoice Preview Modal */}
        <Modal
          isOpen={!!showPreviewModal}
          onClose={() => setShowPreviewModal(null)}
          title="Invoice Detail"
          size="lg"
        >
          {showPreviewModal && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Invoice ID</p>
                  <p className="font-medium">INV/{showPreviewModal.id}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Tanggal</p>
                  <p className="font-medium">
                    {new Date(showPreviewModal.date).toLocaleDateString('id-ID')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Client</p>
                  <p className="font-medium">{showPreviewModal.clients?.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <Badge
                    variant={showPreviewModal.status === 'paid' ? 'success' : 'warning'}
                  >
                    {showPreviewModal.status === 'paid' ? 'Dibayar' : 'Menunggu'}
                  </Badge>
                </div>
              </div>

              {showPreviewModal.invoice_items && showPreviewModal.invoice_items.length > 0 && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">Items</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Deskripsi</th>
                          <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Jumlah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {showPreviewModal.invoice_items.map((item, index) => (
                          <tr key={index}>
                            <td className="px-4 py-3 text-sm text-gray-900">{item.description}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {formatCurrency(item.amount)}
                            </td>
                          </tr>
                        ))}
                        <tr className="bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">Total</td>
                          <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                            {formatCurrency(showPreviewModal.total)}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={() => setShowPreviewModal(null)}>
                  Tutup
                </Button>
                <Button onClick={() => generatePDF(showPreviewModal)}>
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
              </div>
            </div>
          )}
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          title="Konfirmasi Hapus"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Apakah Anda yakin ingin menghapus invoice ini? Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setConfirmDelete(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={deleteInvoice}
                disabled={loading}
              >
                {loading ? "Menghapus..." : "Hapus"}
              </Button>
            </div>
          </div>
        </Modal>
      </AdminLayout>
    </AuthGuard>
  );
}