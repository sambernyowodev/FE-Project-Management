export function SupportListPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-on-background mb-1">Support Tickets</h1>
        <p className="text-secondary text-sm">Manage issues and track support hours.</p>
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-secondary">
        Support Tickets Table
      </div>
    </div>
  );
}
