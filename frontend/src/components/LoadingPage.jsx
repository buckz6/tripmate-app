export default function LoadingPage({ message = 'Sedang menyiapkan data...', detail = 'Mohon tunggu sebentar sambil kami mengumpulkan informasi terbaru.' }) {
  return (
    <div className="flex min-h-[calc(100vh-6rem)] items-center justify-center px-4 py-10 text-center sm:px-6">
      <div className="w-full max-w-xl rounded-[2rem] border border-slate-800 bg-slate-950/95 p-10 shadow-2xl shadow-black/30">
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-[2rem] bg-teal-500 text-4xl shadow-lg shadow-teal-500/20">
          ✈️
        </div>
        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-white">TripMate</h1>
          <p className="text-base text-slate-300">{message}</p>
          <div className="relative mx-auto mt-6 h-24 w-24">
            <div className="absolute inset-0 rounded-full border-4 border-slate-700" />
            <div className="absolute inset-0 animate-spin rounded-full border-4 border-slate-200 border-t-teal-400" />
            <div className="absolute inset-0 flex items-center justify-center text-3xl">🌎</div>
          </div>
          <p className="text-sm text-slate-500">{detail}</p>
        </div>
      </div>
    </div>
  );
}
