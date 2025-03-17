"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import React from "react";

interface BreadcrumbItem {
    label: string;
    link?: string;
}

export const SolidBreadcrumb: React.FC = () => {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean); // Remove empty segments

    let breadcrumbItems: BreadcrumbItem[] = [];

    if (segments.length >= 4 && segments[0] === "admin" && segments[1] === "core") {
        const moduleName = segments[2].replace(/-/g, " "); // Convert kebab-case to normal text
        const modelName = segments[3].replace(/-/g, " ");

        breadcrumbItems.push({ label: moduleName, link: `/admin/core/${segments[2]}` });
        breadcrumbItems.push({ label: modelName, link: `/admin/core/${segments[2]}/${segments[3]}` });

        if (segments.length === 5) {
            // List or Kanban View
            breadcrumbItems.push({ label: segments[4] === "kanban" ? "Kanban" : "List" });
        }

        if (segments.length === 6 && segments[4] === "form") {
            // Form View with ID or "New"
            breadcrumbItems.push({ label: segments[5] });
        }
    }

    const items = breadcrumbItems.map((item) => ({
        label: item.label,
        ...(item.link
            ? {
                  template: () => (
                      <Link href={item.link as string}> {/* Ensuring item.link is a string */}
                          <p className="text-primary font-normal">{item.label}</p>
                      </Link>
                  ),
              }
            : {}),
    }));

    return <BreadCrumb model={items} className="solid-breadcrumb" />;
};