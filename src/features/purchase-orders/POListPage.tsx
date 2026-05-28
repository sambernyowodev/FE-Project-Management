export function POListPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-3xl font-bold text-on-background mb-1">Purchase Orders</h1>
        <p className="text-secondary text-sm">Manage client POs and track budgets.</p>
      </div>
      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-6 text-secondary">
        PO List Table
      </div>
    </div>
  );
}
