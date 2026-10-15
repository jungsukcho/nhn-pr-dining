import { createClient } from '@supabase/supabase-js'

export default async function handler(req, res) {
  // Vercel Cron만 호출할 수 있도록 보호
  const auth = req.headers.authorization
  if (process.env.CRON_SECRET && auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).send('Unauthorized')
  }

  const url = process.env.VITE_SUPABASE_URL
const key = process.env.VITE_SUPABASE_KEY

  if (!url || !key) {
    return res.status(500).json({ ok: false, error: 'Missing Supabase env vars' })
  }

  const supabase = createClient(url, key)
  const { data, error } = await supabase.from('keep_alive').select('id').limit(1)

  if (error) {
    return res.status(500).json({ ok: false, error: error.message })
  }
  return res.status(200).json({ ok: true, rows: data?.length ?? 0, at: new Date().toISOString() })
}
