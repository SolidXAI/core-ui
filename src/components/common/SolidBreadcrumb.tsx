"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";

interface BreadcrumbItem {
    label: string;
    link?: string;
}

export const SolidBreadcrumb = () => {
    const pathname = usePathname();
    const segments = pathname.split("/").filter(Boolean); // Remove empty segments

    let breadcrumbItems: BreadcrumbItem[] = [];

    if (segments.length >= 4 && segments[0] === "admin" && segments[1] === "core") {
        const moduleName = segments[2].replace(/-/g, " "); // Convert kebab-case to normal text
        const modelName = segments[3].replace(/-/g, " ");

        // 4th segment: Add "/home" instead of 5th and 6th segments
        breadcrumbItems.push({ label: moduleName, link: `/admin/core/${segments[2]}/home` });

        // 5th segment: Replace "form/new" or "form/[id]" with "List" and update link
        if (segments.length >= 5) {
            if (segments[4] === "form" && segments.length === 6) {
                breadcrumbItems.push({ label: "List", link: `/admin/core/${segments[2]}/${segments[3]}/list` });
            } else {
                breadcrumbItems.push({ label: modelName, link: `/admin/core/${segments[2]}/${segments[3]}` });
            }
        }

        // 6th segment: Keep as it is
        if (segments.length === 6) {
            breadcrumbItems.push({ label: segments[5] });
        }
    }

    const items = breadcrumbItems.map((item) => ({
        label: item.label,
        ...(item.link
            ? {
                template: () => (
                    <Link href={item.link!}>
                        <p className="text-primary font-normal">{item.label}</p>
                    </Link>
                ),
            }
            : {}),
    }));

    return <BreadCrumb model={items} className="solid-breadcrumb" />;
};