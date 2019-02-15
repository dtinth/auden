export function firebaseToEntries(data: any) {
  return Object.keys(data || {}).map(key => ({ key, val: data[key] }))
}
