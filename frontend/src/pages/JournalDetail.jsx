import { useParams } from 'react-router-dom';

export default function JournalDetail() {
  const { id } = useParams();

  return (
    <section className="mx-auto max-w-4xl rounded-3xl border border-slate-800 bg-slate-900/90 p-8 shadow-xl shadow-black/20">
      <h1 className="text-3xl font-bold text-white">Journal Detail</h1>
      <p className="mt-2 text-slate-400">Viewing entry ID: <span className="font-semibold text-white">{id}</span></p>

      <div className="mt-8 rounded-3xl bg-slate-950/90 p-6">
        <p className="text-slate-300">This page will display the full journal entry and trip details for the selected item.</p>
      </div>
    </section>
  );
}
