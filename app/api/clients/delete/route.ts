import { supabaseAdmin } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  const { id } = await req.json()

  const { error } = await supabaseAdmin.from('clients').delete().eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
