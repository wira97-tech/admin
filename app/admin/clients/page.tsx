'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Plus,
  Edit,
  Trash2,
  User,
  Mail,
  Phone,
  Briefcase,
  ChevronLeft,
  ChevronRight,
  X
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import AuthGuard from '@/components/AuthGuard'
import { AdminLayout } from '@/components/layout/AdminLayout'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { Badge } from '@/components/ui/Badge'
import { Textarea } from '@/components/ui/Textarea'

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
  const [loading, setLoading] = useState(true)
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)
  const [form, setForm] = useState({
    clientName: '',
    email: '',
    phone: '',
    projects: [{ name: '', description: '' }],
  })

  const [page, setPage] = useState(1)
  const perPage = 6
  const router = useRouter()

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  const fetchData = async () => {
    setLoading(true)
    const { data } = await supabase
      .from('clients')
      .select('id, name, email, phone, projects(id, name, description)')
      .order('name')

    if (data) setClients(data)
    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleSubmit = async () => {
    try {
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

      resetForm()
      fetchData()
    } catch (error) {
      console.error('Error saving client:', error)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await supabase.from('projects').delete().eq('client_id', id)
      await supabase.from('clients').delete().eq('id', id)
      setDeleteConfirm(null)
      fetchData()
    } catch (error) {
      console.error('Error deleting client:', error)
    }
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

  const resetForm = () => {
    setForm({ clientName: '', email: '', phone: '', projects: [{ name: '', description: '' }] })
    setEditingClient(null)
    setShowModal(false)
  }

  const filteredClients = clients.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  )

  const totalPages = Math.ceil(filteredClients.length / perPage)
  const paginatedClients = filteredClients.slice((page - 1) * perPage, page * perPage)

  const addProject = () => {
    setForm({
      ...form,
      projects: [...form.projects, { name: '', description: '' }]
    })
  }

  const removeProject = (index: number) => {
    setForm({
      ...form,
      projects: form.projects.filter((_, i) => i !== index)
    })
  }

  const updateProject = (index: number, field: 'name' | 'description', value: string) => {
    const newProjects = [...form.projects]
    newProjects[index] = { ...newProjects[index], [field]: value }
    setForm({ ...form, projects: newProjects })
  }

  return (
    <AuthGuard>
      <AdminLayout onLogout={logout}>
        {/* Page Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Clients</h1>
              <p className="mt-2 text-gray-600">Kelola client dan proyek mereka</p>
            </div>
            <Button onClick={() => setShowModal(true)} className="inline-flex items-center">
              <Plus className="h-4 w-4 mr-2" />
              Client Baru
            </Button>
          </div>
        </div>

        {/* Search Bar */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Cari client berdasarkan nama atau email..."
                className="pl-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </CardContent>
        </Card>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <>
            {/* Clients Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {paginatedClients.map((client) => (
                <Card key={client.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center">
                        <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
                          <User className="h-6 w-6 text-primary-600" />
                        </div>
                        <div className="ml-3">
                          <CardTitle className="text-lg">{client.name}</CardTitle>
                          <Badge variant="secondary" className="mt-1 text-xs">
                            {client.projects.length} project{client.projects.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(client)}
                          className="text-blue-600 hover:text-blue-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirm(client.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Mail className="h-4 w-4 mr-2 text-gray-400" />
                        {client.email}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <Phone className="h-4 w-4 mr-2 text-gray-400" />
                        {client.phone}
                      </div>
                      {client.projects.length > 0 && (
                        <div className="pt-3 border-t">
                          <p className="text-sm font-medium text-gray-900 mb-2">Projects:</p>
                          <div className="space-y-2">
                            {client.projects.slice(0, 3).map((project) => (
                              <div key={project.id} className="flex items-start">
                                <Briefcase className="h-4 w-4 mr-2 text-gray-400 mt-0.5" />
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-900">{project.name}</p>
                                  <p className="text-xs text-gray-500">{project.description}</p>
                                </div>
                              </div>
                            ))}
                            {client.projects.length > 3 && (
                              <p className="text-xs text-gray-500">
                                +{client.projects.length - 3} more projects
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {paginatedClients.length === 0 && (
              <Card>
                <CardContent className="text-center py-12">
                  <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {search ? 'Tidak ada client ditemukan' : 'Belum ada client'}
                  </h3>
                  <p className="text-gray-500 mb-4">
                    {search ? 'Coba ubah kata kunci pencarian' : 'Tambahkan client pertama Anda untuk memulai'}
                  </p>
                  {!search && (
                    <Button onClick={() => setShowModal(true)}>
                      <Plus className="h-4 w-4 mr-2" />
                      Client Baru
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-gray-600">
                  Halaman {page} dari {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </>
        )}

        {/* Add/Edit Modal */}
        <Modal
          isOpen={showModal}
          onClose={resetForm}
          title={editingClient ? 'Edit Client' : 'Client Baru'}
          size="lg"
        >
          <div className="space-y-6">
            {/* Client Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Informasi Client</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nama Client *
                  </label>
                  <Input
                    type="text"
                    placeholder="Masukkan nama client"
                    value={form.clientName}
                    onChange={(e) => setForm({ ...form, clientName: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <Input
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  No. Telepon
                </label>
                <Input
                  type="text"
                  placeholder="+62 812-3456-7890"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
            </div>

            {/* Projects */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">Projects</h3>
                <Button variant="outline" size="sm" onClick={addProject}>
                  <Plus className="h-4 w-4 mr-2" />
                  Tambah Project
                </Button>
              </div>
              <div className="space-y-4">
                {form.projects.map((project, idx) => (
                  <Card key={idx} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-medium text-gray-900">Project {idx + 1}</h4>
                        {form.projects.length > 1 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeProject(idx)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Nama Project *
                        </label>
                        <Input
                          type="text"
                          placeholder="Nama project"
                          value={project.name}
                          onChange={(e) => updateProject(idx, 'name', e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Deskripsi Project
                        </label>
                        <Textarea
                          placeholder="Deskripsi singkat project"
                          value={project.description}
                          onChange={(e) => updateProject(idx, 'description', e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button variant="outline" onClick={resetForm}>
                Batal
              </Button>
              <Button onClick={handleSubmit}>
                {editingClient ? 'Update' : 'Simpan'} Client
              </Button>
            </div>
          </div>
        </Modal>

        {/* Delete Confirmation Modal */}
        <Modal
          isOpen={!!deleteConfirm}
          onClose={() => setDeleteConfirm(null)}
          title="Konfirmasi Hapus"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Apakah Anda yakin ingin menghapus client ini? Tindakan ini tidak dapat dibatalkan dan akan menghapus semua project yang terkait.
            </p>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
                Batal
              </Button>
              <Button
                variant="destructive"
                onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
              >
                Hapus
              </Button>
            </div>
          </div>
        </Modal>
      </AdminLayout>
    </AuthGuard>
  )
}
