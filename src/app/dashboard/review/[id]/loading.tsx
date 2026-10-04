import { Loader2 } from "lucide-react"

export default function ReviewLoading() {
  return (
    <div className="min-h-screen bg-[#EFF2F9] flex items-center justify-center px-6">
      <div className="flex flex-col items-center gap-3">
        <Loader2 className="w-8 h-8 text-[#1170CD] animate-spin" />
        <p className="text-sm text-[#425066]">Preparing your resume...</p>
      </div>
    </div>
  )
}