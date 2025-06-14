import Link from 'next/link'

export default function HomePage() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center space-y-4 p-6 bg-white shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold text-green-700">Selamat Datang di Admin Dashboard Akusara Digital Agency</h1>
        <p className="text-gray-600">Anda dapat mengakses halaman admin dengan klik tombol di bawah ini.</p>
        <Link href="/admin/login">
          <button className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Masuk sebagai Admin
          </button>
        </Link>
      </div>
    </main>
  )
}
