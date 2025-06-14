"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface Client {
  id: string;
  name: string;
}

interface InvoiceItem {
  description: string;
  amount: number;
}

interface ConfirmDialogProps {
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
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

interface InvoiceItemRecord {
  description: string;
  amount: number;
}



function ConfirmDialog({ message, onConfirm, onCancel, loading }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-96">
        <p className="mb-4 text-lg">{message}</p>
        <div className="flex justify-end space-x-4">
          <button
            className="px-4 py-2 bg-gray-300 rounded"
            onClick={onCancel}
            disabled={loading}
          >
            Batal
          </button>
          <button
            className="px-4 py-2 bg-red-600 text-white rounded"
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? "Menghapus..." : "Hapus"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function InvoicesPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState("");
  const [items, setItems] = useState<InvoiceItem[]>([{ description: "", amount: 0 }]);
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [confirmDelete, setConfirmDelete] = useState<null | string>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchClients();
    fetchInvoices();
  }, []);

  const fetchClients = async () => {
    const { data } = await supabase.from("clients").select("id, name");
    if (data) setClients(data);
  };

  const fetchInvoices = async () => {
   const { data } = await supabase
  .from("invoices")
  .select("*, clients(name)")
  .order("created_at", { ascending: false });
    if (data) setInvoices(data);
  };

  const handleItemChange = (
    index: number,
    field: keyof InvoiceItem,
    value: string
  ) => {
    const newItems = [...items];
    if (field === "amount") {
      newItems[index].amount = parseFloat(value);
    } else {
      newItems[index].description = value;
    }
    setItems(newItems);
  };

  const addItem = () => setItems([...items, { description: "", amount: 0 }]);

  const createInvoice = async () => {
    const total = items.reduce((sum, item) => sum + item.amount, 0);
    const { data: invoice } = await supabase
      .from("invoices")
      .insert({ client_id: selectedClient, date: new Date(), total, status: 'unpaid' })
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
      setItems([{ description: "", amount: 0 }]);
      fetchInvoices();
    }
  };

  const confirmDeleteInvoice = (id: string) => {
    setConfirmDelete(id);
  };

  const deleteInvoice = async () => {
    if (!confirmDelete) return;

    setLoading(true);
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
    setLoading(false);
    fetchInvoices();
  };

  const generatePDF = async (invoice: InvoiceWithClient) => {
    const { data: items } = await supabase
      .from("invoice_items")
      .select("description, amount")
      .eq("invoice_id", invoice.id);

    const doc = new jsPDF();

    const imgData = "/logo.jpeg";
    const image = new Image();
    image.src = imgData;
    image.onload = () => {
      doc.addImage(image, "JPEG", 150, 10, 40, 40);

      doc.text(`INVOICE`, 14, 18)
      doc.text(`INV/${invoice.id}`, 14, 28)
      doc.text(`Client: ${invoice.clients?.name || ""}`, 14, 38);

      const date = new Date(invoice.date);
      const formattedDate = `${date.getDate()} / ${
        date.getMonth() + 1
      } / ${date.getFullYear()}`;
      doc.text(`Date: ${formattedDate}`, 14, 48);

      autoTable(doc, {
        startY: 58,
        head: [["Description", "Amount"]],
        body: (items || []).map((item) => [
          item.description || "",
          `Rp ${item.amount}`,
        ]),
      });
       const finalY = (doc as unknown as { lastAutoTable?: { finalY?: number } }).lastAutoTable?.finalY ?? 78;
      doc.text(`Total: Rp ${invoice.total}`, 14, finalY + 10);

      const paymentUrl = invoice.status === 'paid'
        ? `${window.location.origin}/payment/success?id=${invoice.id}`
        : `${window.location.origin}/payment/${invoice.id}`

      doc.textWithLink(
        invoice.status === 'paid' ? 'Pembayaran berhasil' : 'Bayar sekarang di sini',
        14,
        finalY + 20,
        { url: paymentUrl }
      );

      doc.setDrawColor(0);
      doc.setLineWidth(0.5);
      doc.line(14, 270, 196, 270);

      doc.text("Akusara Digital Agency", 14, 278);
      doc.text("Jl. Sesetan No.1 Denpasar, Bali Indonesia", 14, 284);
      doc.save(`invoice-${invoice.id}.pdf`);
    };
  };

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-bold">Buat Invoice</h2>
      <div className="space-y-3">
        <select
          className="border p-2 w-full"
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

        {items.map((item, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="border p-2 w-full"
              placeholder="Deskripsi"
              value={item.description}
              onChange={(e) =>
                handleItemChange(i, "description", e.target.value)
              }
            />
            <input
              className="border p-2 w-32"
              type="number"
              placeholder="Jumlah"
              value={item.amount}
              onChange={(e) => handleItemChange(i, "amount", e.target.value)}
            />
          </div>
        ))}
        <button className="text-blue-600" onClick={addItem}>
          + Tambah Item
        </button>
        <button
          className="bg-green-600 text-white px-4 py-2 rounded"
          onClick={createInvoice}
        >
          Simpan Invoice
        </button>
      </div>

      <h2 className="text-xl font-bold">Daftar Invoice</h2>
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2 text-left">Client</th>
            <th className="border p-2 text-left">Tanggal</th>
            <th className="border p-2 text-left">Total</th>
            <th className="border p-2 text-left">Status</th>
            <th className="border p-2 text-left">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {invoices.map((inv) => (
            <tr key={inv.id} className="border-t">
              <td className="border p-2">{inv.clients?.name}</td>
              <td className="border p-2">
                {new Date(inv.date).toLocaleDateString()}
              </td>
              <td className="border p-2">Rp {inv.total}</td>
              <td className="border p-2">{inv.status}</td>
              <td className="border p-2 space-x-2">
                <button
                  className="text-blue-600 underline"
                  onClick={() => generatePDF(inv)}
                >
                  Export PDF
                </button>
                <button
                  className="text-red-600 underline"
                  onClick={() => confirmDeleteInvoice(inv.id)}
                >
                  Hapus
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {confirmDelete && (
        <ConfirmDialog
          message="Apakah Anda yakin ingin menghapus invoice ini?"
          onConfirm={deleteInvoice}
          onCancel={() => setConfirmDelete(null)}
          loading={loading}
        />
      )}
    </div>
  );
}
