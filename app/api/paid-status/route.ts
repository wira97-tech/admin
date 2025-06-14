import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.json();

  if (!body.id || !body.status) {
    return NextResponse.json({ error: 'Missing invoice id or status' }, { status: 400 });
  }

  const { error } = await supabase
    .from('invoices')
    .update({ status: body.status })
    .eq('id', body.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
