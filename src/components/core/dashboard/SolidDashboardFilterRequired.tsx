"use client";
export const SolidDashboardFilterRequired = () => {
  return (
    <div className="m-3 flex flex-column align-items-center justify-content-center p-4 border-round"
      style={{ background: "var(--surface-card)", border: "1px solid var(--surface-border)" }}>
      <i className="pi pi-filter text-4xl mb-3" style={{ color: "var(--primary-color)" }} />
      <h3 className="m-0 mb-2">Filters Required</h3>
      <p className="text-600 text-center">
        Please select the required filters to render your dashboard.
      </p>
    </div>
  )
}