export function Progress({ value = 0 }: { value?: number }) {
  return <div className="h-2 bg-gray-200 rounded"><div className="h-2 bg-[#4D148C] rounded" style={{ width: `${value}%` }} /></div>
}
