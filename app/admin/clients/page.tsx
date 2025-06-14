'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import AuthGuard from '@/components/AuthGuard'

interface Client {
  id: string
  name: string
  email: string
  phone: string
  projects: Project[]
}

interface Project {
  id?: string
  name: string
  description: string
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([])
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState<Client | null>(null)
  const [form, setForm] = useState({
    clientName: '',
    email: '',
    phone: '',
    projects: [{ name: '', description: '' }],
  })

  const [page, setPage] = useState(1)
  const perPage = 5

  const fetchData = async () => {
    const { data } = await supabase
      .from('clients')
      .select('id, name, email, phone, projects(id, name, description)')
      .order('name')

    if (data) setClients(data)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async () => {
    if (editingClient) {
      // Update client
      await supabase.from('clients').update({
        name: form.clientName,
        email: form.email,
        phone: form.phone,
      }).eq('id', editingClient.id)

      // Delete old projects
      await supabase.from('projects').delete().eq('client_id', editingClient.id)

      // Insert new ones
      await supabase.from('projects').insert(
        form.projects.map(p => ({
          ...p,
          client_id: editingClient.id
        }))
      )
    } else {
      // Insert new client
      const { data: client } = await supabase
        .from('clients')
        .insert({
          name: form.clientName,
          email: form.email,
          phone: form.phone,
        }).select().single()

      if (client) {
        await supabase.from('projects').insert(
          form.projects.map(p => ({
            ...p,
            client_id: client.id
          }))
        )
      }
    }

    setForm({ clientName: '', email: '', phone: '', projects: [{ name: '', description: '' }] })
    setEditingClient(null)
    setShowModal(false)
    fetchData()
  }

  const handleDelete = async (id: string) => {
    await supabase.from('projects').delete().eq('client_id', id)
    await supabase.from('clients').delete().eq('id', id)
    fetchData()
  }

  const openEditModal = (client: Client) => {
    setEditingClient(client)
    setForm({
      clientName: client.name,
      email: client.email,
      phone: client.phone,
      projects: client.projects.map(p => ({
        name: p.name,
        description: p.description
      })),
    })
    setShowModal(true)
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  )

  const paginatedClients = filteredClients.slice((page - 1) * perPage, page * perPage)

  return (
    <AuthGuard>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Daftar Client & Proyek</h2>
          <button
            className="bg-green-600 text-white px-4 py-2 rounded"
            onClick={() => {
              setForm({ clientName: '', email: '', phone: '', projects: [{ name: '', description: '' }] })
              setEditingClient(null)
              setShowModal(true)
            }}
          >
            + Tambah
          </button>
        </div>

        <input
          type="text"
          placeholder="Cari client..."
          className="w-full border p-2 rounded mb-4"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {paginatedClients.map(client => (
          <div key={client.id} className="border p-4 rounded mb-4">
            <div className="flex justify-between">
              <div>
                <h3 className="text-lg font-semibold text-green-700">{client.name}</h3>
                <p className="text-sm text-gray-600">Email: {client.email}</p>
                <p className="text-sm text-gray-600 mb-2">Phone: {client.phone}</p>
                <ul className="pl-5 list-disc">
                  {client.projects.map(project => (
                    <li key={project.id}>
                      <strong>{project.name}</strong>: {project.description}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => openEditModal(client)}
                  className="text-blue-600 hover:underline"
                >Edit</button>
                <button
                  onClick={() => handleDelete(client.id)}
                  className="text-red-600 hover:underline"
                >Hapus</button>
              </div>
            </div>
          </div>
        ))}

        <div className="flex justify-center gap-4 mt-4">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}>← Prev</button>
          <span>Halaman {page}</span>
          <button onClick={() => setPage(p => (p * perPage < filteredClients.length ? p + 1 : p))}>Next →</button>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
            <div className="bg-white p-6 rounded shadow-lg w-full max-w-md space-y-3">
              <h2 className="text-lg font-semibold mb-2">{editingClient ? 'Edit' : 'Tambah'} Client & Proyek</h2>
              <input
                type="text"
                placeholder="Nama Client"
                className="w-full border p-2 rounded"
                value={form.clientName}
                onChange={e => setForm({ ...form, clientName: e.target.value })}
              />
              <input
                type="email"
                placeholder="Email Client"
                className="w-full border p-2 rounded"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
              />
              <input
                type="text"
                placeholder="No. Telepon"
                className="w-full border p-2 rounded"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
              />

              {form.projects.map((project, idx) => (
                <div key={idx} className="border rounded p-2 mb-2 space-y-1">
                  <input
                    type="text"
                    placeholder="Nama Proyek"
                    className="w-full border p-2 rounded"
                    value={project.name}
                    onChange={e => {
                      const newProjects = [...form.projects]
                      newProjects[idx].name = e.target.value
                      setForm({ ...form, projects: newProjects })
                    }}
                  />
                  <textarea
                    placeholder="Deskripsi Proyek"
                    className="w-full border p-2 rounded"
                    value={project.description}
                    onChange={e => {
                      const newProjects = [...form.projects]
                      newProjects[idx].description = e.target.value
                      setForm({ ...form, projects: newProjects })
                    }}
                  />
                  {form.projects.length > 1 && (
                    <button
                      className="text-sm text-red-600 underline"
                      onClick={() => {
                        const newProjects = form.projects.filter((_, i) => i !== idx)
                        setForm({ ...form, projects: newProjects })
                      }}
                    >Hapus Proyek</button>
                  )}
                </div>
              ))}

              <button
                className="text-sm text-green-600 underline"
                onClick={() =>
                  setForm({ ...form, projects: [...form.projects, { name: '', description: '' }] })
                }
              >
                + Tambah Proyek
              </button>

              <div className="flex justify-end gap-2">
                <button className="text-gray-600" onClick={() => setShowModal(false)}>Batal</button>
                <button className="bg-green-600 text-white px-4 py-2 rounded" onClick={handleSubmit}>
                  {editingClient ? 'Update' : 'Simpan'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}
