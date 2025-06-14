"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../../lib/supabase";
import AuthGuard from "../../../components/AuthGuard";

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
}


export default function DashboardPage() {
  const [summary, setSummary] = useState({ total: 0, paid: 0, unpaid: 0 });
  const [clients, setClients] = useState<Client[]>([]);
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  useEffect(() => {
    const fetchSummary = async () => {
      const { data } = await supabase.from("invoices").select("status, amount");
      let total = 0,
        paid = 0,
        unpaid = 0;
      data?.forEach((inv: Invoice) => {
        total += inv.amount;
        if (inv.status === "paid") paid += inv.amount;
        else unpaid += inv.amount;
      });
      setSummary({ total, paid, unpaid });
    };

    const fetchClients = async () => {
      const { data } = await supabase
        .from("clients")
        .select("id, name, projects(name)")
        .order("name")
        .limit(5);

      if (data) setClients(data);
    };

    fetchSummary();
    fetchClients();
  }, []);

  return (
    <AuthGuard>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Ringkasan Pembayaran</h2>
          <button onClick={logout} className="text-sm text-red-600 underline">
            Logout
          </button>
          <div className="flex gap-2">
            <Link
              href="/admin/invoices"
              className="bg-blue-600 text-black px-4 py-2 rounded text-sm"
            >
              Invoice
            </Link>
            <button onClick={logout} className="text-sm text-red-600 underline">
              Logout
            </button>
          </div>
        </div>

        {/* Ringkasan Pembayaran */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-green-100 rounded">
            Total: Rp {summary.total}
          </div>
          <div className="p-4 bg-green-200 rounded">
            Terbayar: Rp {summary.paid}
          </div>
          <div className="p-4 bg-yellow-100 rounded">
            Belum bayar: Rp {summary.unpaid}
          </div>
        </div>

        {/* Client & Project Card */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold">Client Terbaru</h3>
            <Link
              href="/admin/clients"
              className="text-sm text-blue-600 underline"
            >
              Lihat Semua
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {clients.map((client) => (
              <Link
                key={client.id}
                href="/admin/clients"
                className="block border p-4 rounded hover:bg-gray-50 transition"
              >
                <div className="font-medium text-green-700">{client.name}</div>
                {client.projects.length > 0 ? (
                  <ul className="text-sm text-gray-600 list-disc ml-5 mt-1">
                    {client.projects.slice(0, 3).map((p: Project, idx: number) => (
                      <li key={idx}>{p.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400 mt-1">
                    Belum ada project
                  </p>
                )}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
