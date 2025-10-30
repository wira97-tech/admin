"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import AuthGuard from '@/components/AuthGuard';
import { AdminLayout } from '@/components/layout/AdminLayout';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Badge } from '@/components/ui/Badge';
import {
  Building,
  Mail,
  Phone,
  MapPin,
  Globe,
  CreditCard,
  Users,
  Bell,
  Shield,
  Database,
  TestTube,
  Save,
  RefreshCw
} from 'lucide-react';

interface AppSettings {
  company: {
    name: string;
    email: string;
    phone: string;
    address: string;
    currency: string;
    timezone: string;
  };
  invoice: {
    auto_numbering: boolean;
    payment_terms: string;
    late_fee_enabled: boolean;
    late_fee_percentage: string;
  };
  email: {
    smtp_host: string;
    smtp_port: string;
    smtp_user: string;
    smtp_password: string;
    from_email: string;
    from_name: string;
  };
  payment: {
    midtrans_server_key: string;
    midtrans_client_key: string;
    midtrans_environment: string;
    payment_success_url: string;
    payment_failure_url: string;
    enable_notifications: boolean;
  };
}

interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: string;
  is_active: boolean;
  last_login: string;
  created_at: string;
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('general');
  const [settings, setSettings] = useState<AppSettings>({
    company: {
      name: '',
      email: '',
      phone: '',
      address: '',
      currency: 'IDR',
      timezone: 'Asia/Jakarta',
    },
    invoice: {
      auto_numbering: true,
      payment_terms: '30',
      late_fee_enabled: false,
      late_fee_percentage: '10',
    },
    email: {
      smtp_host: '',
      smtp_port: '587',
      smtp_user: '',
      smtp_password: '',
      from_email: '',
      from_name: '',
    },
    payment: {
      midtrans_server_key: '',
      midtrans_client_key: '',
      midtrans_environment: 'sandbox',
      payment_success_url: '/payment/success',
      payment_failure_url: '/payment/failed',
      enable_notifications: true,
    },
  });

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testingEmail, setTestingEmail] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const router = useRouter();

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/admin/login');
  };

  useEffect(() => {
    fetchSettings();
    fetchUsers();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/settings/general');

      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      } else {
        console.error('Error fetching settings from API');
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      // For now, create mock user data since user_profiles table might not exist yet
      const mockUsers: UserProfile[] = [
        {
          id: 'mock-user-1',
          email: 'admin@akusara.com',
          name: 'Admin User',
          role: 'admin',
          is_active: true,
          last_login: new Date().toISOString(),
          created_at: new Date().toISOString(),
        }
      ];

      setUsers(mockUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const updateSetting = async (category: string, settingKey: string, value: any) => {
    try {
      const response = await fetch('/api/settings/general', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          category,
          settingKey,
          value,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update setting');
      }
    } catch (error) {
      console.error('Error updating setting:', error);
      throw error;
    }
  };

  const handleSaveSettings = async (category: keyof AppSettings) => {
    try {
      setSaving(true);
      setMessage(null);

      const categorySettings = settings[category];
      const updates = [];

      for (const [key, value] of Object.entries(categorySettings)) {
        updates.push(updateSetting(category, key, value));
      }

      await Promise.all(updates);

      setMessage({ type: 'success', text: 'Settings saved successfully!' });
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    try {
      setTestingEmail(true);
      setMessage(null);

      const response = await fetch('/api/settings/test-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          smtp_host: settings.email.smtp_host,
          smtp_port: settings.email.smtp_port,
          smtp_user: settings.email.smtp_user,
          smtp_password: settings.email.smtp_password,
          from_email: settings.email.from_email,
          from_name: settings.email.from_name,
        }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Test email sent successfully!' });
      } else {
        const error = await response.json();
        setMessage({ type: 'error', text: error.message || 'Failed to send test email' });
      }
    } catch (error) {
      console.error('Error testing email:', error);
      setMessage({ type: 'error', text: 'Failed to send test email' });
    } finally {
      setTestingEmail(false);
    }
  };

  const tabs = [
    { id: 'general', label: 'General', icon: Building },
    { id: 'invoice', label: 'Invoice', icon: CreditCard },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'payment', label: 'Payment', icon: CreditCard },
    { id: 'users', label: 'Users', icon: Users },
  ];

  if (loading) {
    return (
      <AuthGuard>
        <AdminLayout onLogout={logout}>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </AdminLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <AdminLayout onLogout={logout}>
        <div className="space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="mt-2 text-gray-600">
              Manage your application settings and preferences
            </p>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success'
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {message.text}
            </div>
          )}

          {/* Tabs */}
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`group inline-flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="mr-2 h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {/* General Settings */}
            {activeTab === 'general' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Company Information</h3>
                  <Button
                    onClick={() => handleSaveSettings('company')}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Company Name</label>
                    <Input
                      type="text"
                      value={settings.company.name}
                      onChange={(e) => setSettings({
                        ...settings,
                        company: { ...settings.company, name: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <Input
                      type="email"
                      value={settings.company.email}
                      onChange={(e) => setSettings({
                        ...settings,
                        company: { ...settings.company, email: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <Input
                      type="tel"
                      value={settings.company.phone}
                      onChange={(e) => setSettings({
                        ...settings,
                        company: { ...settings.company, phone: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Currency</label>
                    <select
                      value={settings.company.currency}
                      onChange={(e) => setSettings({
                        ...settings,
                        company: { ...settings.company, currency: e.target.value }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="IDR">Indonesian Rupiah (IDR)</option>
                      <option value="USD">US Dollar (USD)</option>
                      <option value="EUR">Euro (EUR)</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Address</label>
                    <Textarea
                      value={settings.company.address}
                      onChange={(e) => setSettings({
                        ...settings,
                        company: { ...settings.company, address: e.target.value }
                      })}
                      className="mt-1"
                      rows={3}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Invoice Settings */}
            {activeTab === 'invoice' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Invoice Settings</h3>
                  <Button
                    onClick={() => handleSaveSettings('invoice')}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="auto_numbering"
                      checked={settings.invoice.auto_numbering}
                      onChange={(e) => setSettings({
                        ...settings,
                        invoice: { ...settings.invoice, auto_numbering: e.target.checked }
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="auto_numbering" className="ml-2 block text-sm text-gray-900">
                      Enable automatic invoice numbering
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Default Payment Terms (days)</label>
                    <Input
                      type="number"
                      value={settings.invoice.payment_terms}
                      onChange={(e) => setSettings({
                        ...settings,
                        invoice: { ...settings.invoice, payment_terms: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="late_fee_enabled"
                      checked={settings.invoice.late_fee_enabled}
                      onChange={(e) => setSettings({
                        ...settings,
                        invoice: { ...settings.invoice, late_fee_enabled: e.target.checked }
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="late_fee_enabled" className="ml-2 block text-sm text-gray-900">
                      Enable automatic late fees
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Late Fee Percentage (%)</label>
                    <Input
                      type="number"
                      value={settings.invoice.late_fee_percentage}
                      onChange={(e) => setSettings({
                        ...settings,
                        invoice: { ...settings.invoice, late_fee_percentage: e.target.value }
                      })}
                      className="mt-1"
                      disabled={!settings.invoice.late_fee_enabled}
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Email Settings */}
            {activeTab === 'email' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Email Configuration</h3>
                  <div className="flex space-x-3">
                    <Button
                      variant="outline"
                      onClick={handleTestEmail}
                      disabled={testingEmail}
                    >
                      <TestTube className="w-4 h-4 mr-2" />
                      {testingEmail ? 'Testing...' : 'Test Email'}
                    </Button>
                    <Button
                      onClick={() => handleSaveSettings('email')}
                      disabled={saving}
                    >
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Host</label>
                    <Input
                      type="text"
                      value={settings.email.smtp_host}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, smtp_host: e.target.value }
                      })}
                      className="mt-1"
                      placeholder="smtp.gmail.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Port</label>
                    <Input
                      type="text"
                      value={settings.email.smtp_port}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, smtp_port: e.target.value }
                      })}
                      className="mt-1"
                      placeholder="587"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Username</label>
                    <Input
                      type="text"
                      value={settings.email.smtp_user}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, smtp_user: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">SMTP Password</label>
                    <Input
                      type="password"
                      value={settings.email.smtp_password}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, smtp_password: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From Email</label>
                    <Input
                      type="email"
                      value={settings.email.from_email}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, from_email: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">From Name</label>
                    <Input
                      type="text"
                      value={settings.email.from_name}
                      onChange={(e) => setSettings({
                        ...settings,
                        email: { ...settings.email, from_name: e.target.value }
                      })}
                      className="mt-1"
                    />
                  </div>
                </div>
              </Card>
            )}

            {/* Payment Settings */}
            {activeTab === 'payment' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Payment Gateway Settings</h3>
                  <Button
                    onClick={() => handleSaveSettings('payment')}
                    disabled={saving}
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>

                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Environment</label>
                    <select
                      value={settings.payment.midtrans_environment}
                      onChange={(e) => setSettings({
                        ...settings,
                        payment: { ...settings.payment, midtrans_environment: e.target.value }
                      })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="sandbox">Sandbox</option>
                      <option value="production">Production</option>
                    </select>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Server Key</label>
                      <Input
                        type="password"
                        value={settings.payment.midtrans_server_key}
                        onChange={(e) => setSettings({
                          ...settings,
                          payment: { ...settings.payment, midtrans_server_key: e.target.value }
                        })}
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Client Key</label>
                      <Input
                        type="text"
                        value={settings.payment.midtrans_client_key}
                        onChange={(e) => setSettings({
                          ...settings,
                          payment: { ...settings.payment, midtrans_client_key: e.target.value }
                        })}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="enable_notifications"
                      checked={settings.payment.enable_notifications}
                      onChange={(e) => setSettings({
                        ...settings,
                        payment: { ...settings.payment, enable_notifications: e.target.checked }
                      })}
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <label htmlFor="enable_notifications" className="ml-2 block text-sm text-gray-900">
                      Enable payment notifications
                    </label>
                  </div>
                </div>
              </Card>
            )}

            {/* User Management */}
            {activeTab === 'users' && (
              <Card className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">User Management</h3>
                  <Button>
                    <Users className="w-4 h-4 mr-2" />
                    Add User
                  </Button>
                </div>

                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Last Login
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {users.map((user) => (
                        <tr key={user.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {user.name || 'No name'}
                              </div>
                              <div className="text-sm text-gray-500">
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge variant="outline" className="capitalize">
                              {user.role}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <Badge className={user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                              {user.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {user.last_login
                              ? new Date(user.last_login).toLocaleDateString()
                              : 'Never'
                            }
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <Button variant="ghost" size="sm">
                              Edit
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>
        </div>
      </AdminLayout>
    </AuthGuard>
  );
}