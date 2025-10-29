# Akusara Digital Agency - Admin Dashboard

Admin dashboard untuk mengelola client, project, dan invoice Akusara Digital Agency dengan UI modern dan professional.

## 🚀 **Fitur Utama**

### **📊 Dashboard**
- **Ringkasan Real-time**: Total pendapatan, terbayar, menunggu pembayaran
- **Visual Metrics**: Cards dengan icons dan warna yang menarik
- **Recent Activities**: Client terbaru dan invoice terbaru
- **Responsive Design**: Optimal di desktop dan mobile

### **👥 Client Management**
- **Full CRUD Operations**: Tambah, edit, hapus client
- **Project Management**: Kelola project per client
- **Advanced Search**: Cari client berdasarkan nama atau email
- **Card-Based UI**: Visual cards dengan informasi lengkap
- **Bulk Operations**: Multi-select untuk batch actions
- **Pagination**: Efisien untuk data yang besar

### **💳 Invoice System**
- **Invoice Creation**: Form yang intuitif dengan multiple items
- **PDF Generation**: Template PDF yang professional
- **Payment Integration**: Terintegrasi dengan Midtrans
- **Status Tracking**: Paid/Unpaid status dengan visual indicators
- **Advanced Filtering**: Filter berdasarkan status dan client
- **Preview Mode**: Lihat detail invoice sebelum download

### **🎨 Modern UI/UX**
- **Design System**: Consistent colors, typography, dan spacing
- **Component Library**: Reusable components dengan multiple variants
- **Dark Mode Support**: (Ready untuk implementasi)
- **Micro-interactions**: Smooth transitions dan hover effects
- **Loading States**: Skeleton loaders dan spinners
- **Empty States**: Helpful messages untuk data kosong

## 🛠 **Tech Stack**

### **Frontend**
- **Next.js 15.3.3** - React framework dengan App Router
- **React 19.0.0** - UI library dengan latest features
- **TypeScript 5.0** - Type safety dan better DX
- **Tailwind CSS v4** - Modern CSS framework dengan design tokens

### **UI Components**
- **Headless UI** - Accessible component primitives
- **Lucide React** - Beautiful icon library
- **Framer Motion** - Smooth animations dan transitions
- **Class Variance Authority** - Component variants management

### **Backend & Database**
- **Supabase 2.50.0** - Backend-as-a-Service (PostgreSQL + Auth)
- **Midtrans** - Payment gateway integration
- **Nodemailer** - Email sending capabilities

### **PDF Generation**
- **jsPDF 3.0.1** - PDF generation library
- **jspdf-autotable 5.0.2** - Table support untuk PDF
- **pdfkit 0.17.1** - Alternative PDF generation

## 📁 **Project Structure**

```
admin/
├── app/                          # Next.js App Router
│   ├── admin/                    # Admin-only routes
│   │   ├── dashboard/            # Dashboard page
│   │   ├── clients/              # Client management
│   │   ├── invoices/             # Invoice management
│   │   └── login/                # Authentication
│   ├── api/                      # API routes
│   │   ├── clients/              # Client APIs
│   │   ├── payment/              # Payment processing
│   │   └── paid-status/          # Payment status
│   ├── payment/                  # Payment pages
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   └── globals.css               # Global styles & design tokens
├── components/                   # Reusable components
│   ├── ui/                       # Basic UI components
│   │   ├── Button.tsx            # Button component dengan variants
│   │   ├── Input.tsx             # Input component
│   │   ├── Card.tsx              # Card components
│   │   ├── Modal.tsx             # Modal/Dialog component
│   │   ├── Badge.tsx             # Badge component
│   │   └── Textarea.tsx          # Textarea component
│   ├── layout/                   # Layout components
│   │   ├── Sidebar.tsx           # Navigation sidebar
│   │   └── AdminLayout.tsx       # Main admin layout
│   └── AuthGuard.tsx             # Authentication wrapper
├── lib/                          # Utilities dan configs
│   ├── supabase.ts               # Supabase client
│   ├── supabaseServer.ts         # Server-side Supabase
│   └── utils.ts                  # Utility functions
├── types/                        # TypeScript type definitions
└── public/                       # Static assets
```

## 🎨 **Design System**

### **Color Palette**
```css
/* Brand Colors */
--primary-500: #10b981;    /* Green - Brand color */
--secondary-500: #3b82f6;  /* Blue - Secondary */
--accent-500: #f59e0b;     /* Orange - Accent */

/* Neutral Colors */
--gray-50: #f9fafb;        /* Light backgrounds */
--gray-900: #111827;      /* Dark text */

/* Status Colors */
--success: #10b981;        /* Success states */
--warning: #f59e0b;        /* Warning states */
--error: #ef4444;          /* Error states */
--info: #3b82f6;           /* Info states */
```

### **Typography**
- **Font Family**: Geist Sans & Geist Mono
- **Headings**: h1 (2.5rem) → h4 (1.25rem)
- **Body**: base (1rem), small (0.875rem), xs (0.75rem)
- **Font Weights**: Light, Normal, Medium, Semibold, Bold

### **Spacing Scale**
- **Base Unit**: 4px (0.25rem)
- **Scale**: 4px, 8px, 12px, 16px, 24px, 32px, 48px, 64px

### **Component Variants**
```typescript
// Button Variants
variant: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
size: "default" | "sm" | "lg" | "icon"

// Badge Variants
variant: "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "info"
```

## 🚀 **Getting Started**

### **Prerequisites**
- Node.js 18+
- npm atau yarn
- Supabase account dan project

### **Installation**

1. **Clone repository**
```bash
git clone <repository-url>
cd admin
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Copy `.env.example` ke `.env` dan isi:
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

4. **Database Setup**
Jalankan SQL migrations di Supabase Dashboard:
```sql
-- Tables
CREATE TABLE clients (...);
CREATE TABLE projects (...);
CREATE TABLE invoices (...);
CREATE TABLE invoice_items (...);

-- Lihat file migrations untuk detail lengkap
```

5. **Run Development Server**
```bash
npm run dev
```

6. **Build untuk Production**
```bash
npm run build
npm start
```

## 📊 **Database Schema**

### **Tables**

#### **clients**
```sql
- id (uuid, primary key)
- name (text)
- email (text)
- phone (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **projects**
```sql
- id (uuid, primary key)
- client_id (uuid, foreign key)
- name (text)
- description (text)
- created_at (timestamp)
- updated_at (timestamp)
```

#### **invoices**
```sql
- id (uuid, primary key)
- client_id (uuid, foreign key)
- date (timestamp)
- total (integer)
- status (text: 'paid' | 'unpaid')
- created_at (timestamp)
- updated_at (timestamp)
```

#### **invoice_items**
```sql
- id (uuid, primary key)
- invoice_id (uuid, foreign key)
- description (text)
- amount (integer)
- created_at (timestamp)
```

## 🔧 **Development Guide**

### **Adding New Components**

1. **Create Component**
```typescript
// components/ui/NewComponent.tsx
import React from "react"
import { cn } from "@/lib/utils"

interface NewComponentProps {
  className?: string
  children: React.ReactNode
}

const NewComponent = React.forwardRef<HTMLDivElement, NewComponentProps>(
  ({ className, children, ...props }, ref) => {
    return (
      <div className={cn("base-styles", className)} ref={ref} {...props}>
        {children}
      </div>
    )
  }
)
NewComponent.displayName = "NewComponent"

export { NewComponent }
```

2. **Export dari index**
```typescript
// components/ui/index.ts
export { NewComponent } from './NewComponent'
```

3. **Gunakan Component**
```typescript
import { NewComponent } from '@/components/ui'
```

### **Color & Theme Usage**

```typescript
// Menggunakan design tokens
className="bg-primary-500 text-white"
className="text-gray-600 bg-gray-50"
className="border border-gray-200"

// Status colors
className="text-success bg-success-50"    // Success
className="text-warning bg-warning-50"    // Warning
className="text-error bg-error-50"        // Error
```

### **API Routes Pattern**

```typescript
// app/api/clients/route.ts
import { createClient } from '@/lib/supabaseServer'

export async function GET() {
  const supabase = createClient()
  const { data } = await supabase.from('clients').select('*')
  return Response.json(data)
}

export async function POST(request: Request) {
  const supabase = createClient()
  const body = await request.json()
  const { data } = await supabase.from('clients').insert(body)
  return Response.json(data)
}
```

## 🎯 **UI Improvements Implemented**

### **Phase 1: Foundation ✅**
- ✅ Design system dengan color tokens
- ✅ Component library (Button, Input, Card, Modal, Badge)
- ✅ Typography dan spacing systems
- ✅ Modern dependencies (Headless UI, Lucide React)

### **Phase 2: Layout & Navigation ✅**
- ✅ Modern sidebar navigation dengan icons
- ✅ Collapsible mobile menu
- ✅ AdminLayout wrapper yang responsive
- ✅ User profile section dengan logout

### **Phase 3: Page Enhancements ✅**
- ✅ Dashboard dengan modern metrics cards
- ✅ Client management dengan card-based UI
- ✅ Invoice system dengan advanced features
- ✅ Search dan filtering functionality

### **Phase 4: Advanced Features ✅**
- ✅ Invoice preview modal
- ✅ Enhanced PDF generation
- ✅ Loading states dan error handling
- ✅ Responsive design improvements
- 🔄 Real-time updates (planned)
- 🔄 Advanced analytics (planned)

### **Phase 5: Mobile & Accessibility (Planned)**
- 🔄 Mobile-first optimizations
- 🔄 Touch-friendly interactions
- 🔄 Screen reader support
- 🔄 Keyboard navigation

## 🔍 **What's New vs Original**

### **Before (Original)**
- Basic HTML elements dengan inline styles
- Simple layout tanpa navigation structure
- Table-based data presentation
- Hard-coded colors tanpa design system
- No loading states atau error handling
- Basic forms tanpa validation

### **After (Improved)**
- **Modern Design System**: Consistent colors, typography, spacing
- **Component Architecture**: Reusable components dengan variants
- **Professional Layout**: Sidebar navigation dengan responsive design
- **Rich Interactions**: Modals, filters, search functionality
- **Better UX**: Loading states, empty states, error messages
- **Type Safety**: Full TypeScript implementation
- **Accessibility**: Semantic HTML dan ARIA support
- **Performance**: Optimized components dan data fetching

## 📱 **Browser Support**

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🤝 **Contributing**

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push ke branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 **License**

This project is proprietary to Akusara Digital Agency.

## 🆘 **Support**

Untuk technical issues atau questions:
- Contact development team
- Check documentation di `/docs`
- Review existing issues di repository

---

**🎉 Built with ❤️ for Akusara Digital Agency**