import { supabaseAdmin } from "@/lib/supabaseServer"


export async function POST(req: Request) {
  const { id, name, email, phone } = await req.json()

  const { error } = await supabaseAdmin
    .from('clients')
    .update({ name, email, phone })
    .eq('id', id)

  if (error) return Response.json({ error: error.message }, { status: 500 })

  return Response.json({ success: true })
}
