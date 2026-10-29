export interface PrivateRpcError { code?: string; message: string }
export type PrivateRpc = (name: string, args: Record<string, unknown>) => PromiseLike<{ error: PrivateRpcError | null }>

export function isMissingFunction(error: PrivateRpcError): boolean {
  // PostgREST reports missing cached functions as PGRST202, not PostgreSQL's
  // "does not exist" wording. Do not retry permission, auth or network failures.
  return error.code === 'PGRST202' || error.code === '42883' ||
    /function.*does not exist/i.test(error.message)
}

export async function savePrivateCheckinRpc(rpc: PrivateRpc, payload: Record<string, unknown>) {
  // v3 ships with migration 006. Compatibility is limited to truly missing
  // functions; never retry a possibly executed write after an auth/network error.
  const names = ['save_private_prayer_checkin_v3', 'save_private_prayer_checkin_v2', 'upsert_private_prayer_checkin']
  for (const [index, name] of names.entries()) {
    const { error } = await rpc(name, payload)
    if (!error) return
    if (!isMissingFunction(error) || index === names.length - 1) throw new Error(error.message)
  }
}
