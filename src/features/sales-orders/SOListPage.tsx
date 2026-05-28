export function SOListPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-on-background mb-1">Sales Orders</h1>
        <p className="text-secondary text-sm">Track sales orders tied to POs.</p>
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-secondary">
        SO List Table
      </div>
    </div>
  );
}
