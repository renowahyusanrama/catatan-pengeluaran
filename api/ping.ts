export default function handler(_req: any, res: any) {
  res.status(200).json({
    ok: true,
    message: 'pong',
    hasSupabaseUrl: Boolean(process.env.SUPABASE_URL),
    hasServiceKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
    hasAccessKey: Boolean(process.env.ACCESS_KEY),
    node: process.version,
  });
}