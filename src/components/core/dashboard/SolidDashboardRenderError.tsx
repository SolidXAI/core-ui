"use client";

export const SolidDashboardRenderError = () => {
  return (
    <div className="flex flex-column align-items-center justify-content-center w-full h-full p-4">

            <div className="surface-card p-4 border-round shadow-1 text-center"
                style={{ maxWidth: "420px", width: "100%" }}>

                <i className="pi pi-exclamation-triangle text-red-500 mb-3"
                   style={{ fontSize: "3rem" }} />

                <h3 className="m-0 mb-2">Error Loading Dashboard</h3>

                <p className="text-600 mb-4">
                Failed to load dashboard. Please try again.
                </p>
            </div>
        </div>
  )
}