export default function Community() {
  return (
    <section className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-black/20">
      <h1 className="text-3xl font-bold text-white">Community</h1>
      <p className="mt-2 text-slate-400">Connect with fellow travelers, share tips, and discover local recommendations.</p>

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <div className="rounded-3xl bg-slate-950/90 p-6">
          <h2 className="text-xl font-semibold text-white">Travel Stories</h2>
          <p className="mt-2 text-slate-400">Read community posts, trip highlights, and destination reviews.</p>
        </div>
        <div className="rounded-3xl bg-slate-950/90 p-6">
          <h2 className="text-xl font-semibold text-white">Tips & Advice</h2>
          <p className="mt-2 text-slate-400">Share advice for planning, packing, and making the most of every journey.</p>
        </div>
      </div>
    </section>
  );
}
