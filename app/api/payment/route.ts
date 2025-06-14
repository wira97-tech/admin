import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const invoiceId = searchParams.get('id')

  if (!invoiceId) {
    return NextResponse.json({ error: 'Missing invoice ID' }, { status: 400 })
  }

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, clients:clients(id, name)')
    .eq('id', invoiceId)
    .single()

  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  // Buat order_id yang pendek (maks 50 karakter)
  const shortOrderId = `INV-${invoice.id.slice(0, 8)}-${Date.now().toString().slice(-6)}`

const snapBody = {
  transaction_details: {
    order_id: shortOrderId,
    gross_amount: invoice.total,
  },
  item_details: [
    {
      id: invoice.id,
      name: invoice.description || 'Invoice',
      quantity: 1,
      price: invoice.total,
    },
  ],
  customer_details: {
    first_name: invoice.clients?.name || 'Client',
  },
}

  const midtransServerKey = process.env.MIDTRANS_SERVER_KEY
  if (!midtransServerKey) {
    return NextResponse.json({ error: 'Missing MIDTRANS_SERVER_KEY env' }, { status: 500 })
  }

  const auth = Buffer.from(midtransServerKey + ':').toString('base64')

  const response = await fetch('https://app.sandbox.midtrans.com/snap/v1/transactions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(snapBody),
  })

  if (!response.ok) {
    const errorText = await response.text()
    console.error('Midtrans response error:', errorText)
    return NextResponse.json({ error: 'Midtrans API failed', details: errorText }, { status: 500 })
  }

  const data = await response.json()

  if (!data.token) {
    console.error('Response from Midtrans:', data)
    return NextResponse.json({ error: 'Token not found in Midtrans response' }, { status: 500 })
  }

  return NextResponse.json({ token: data.token })
}
