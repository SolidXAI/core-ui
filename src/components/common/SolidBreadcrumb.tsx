"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import { useEffect } from "react";

interface BreadcrumbItem {
    label: string;
    link?: string;
}

interface Props {
    solidViewData?: any;
    initialEntityData?: any;
}

export const SolidBreadcrumb = (props: Props) => {
    const { solidViewData, initialEntityData } = props;
    const pathname = usePathname();
    const router = useRouter();
    const searchParams = useSearchParams();
    const segments = pathname.split("/").filter(Boolean); // Remove empty segments

    let userKeyFieldValue: string | null = null;

    if (solidViewData?.userKeyField) {
        const userKeyFieldName = solidViewData.userKeyField.name; // Get the name from userKeyField
        if (userKeyFieldName && initialEntityData?.[userKeyFieldName] !== undefined) {
            userKeyFieldValue = initialEntityData[userKeyFieldName]; // Get the value from initialEntityData
        }
    }

    // Extract userKeyField from URL query params
    const queryUserKeyField = searchParams.get("userKeyField");

    // Append `userKeyField` to browser URL if not already present
    useEffect(() => {
        if (segments.length === 6 && segments[4] === "form" && userKeyFieldValue && !queryUserKeyField) {
            const newUrl = `${pathname}?userKeyField=${encodeURIComponent(userKeyFieldValue)}`;
            router.replace(newUrl, { scroll: false }); // Update URL without reloading
        }
    }, [pathname, userKeyFieldValue, queryUserKeyField, router]);

    let breadcrumbItems: BreadcrumbItem[] = [];

    if (segments.length >= 4 && segments[0] === "admin" && segments[1] === "core") {
        const moduleName = segments[2].replace(/-/g, " "); // Convert kebab-case to normal text
        const modelName = segments[3].replace(/-/g, " ");

        // 4th segment: Always "home"
        breadcrumbItems.push({ label: moduleName, link: `/admin/core/${segments[2]}/home` });

        // 5th segment: Determine if it's "List" or the model name
        if (segments.length >= 5) {
            if (segments[4] === "form" && segments.length === 6) {
                breadcrumbItems.push({ label: "List", link: `/admin/core/${segments[2]}/${segments[3]}/list` });
            } else {
                breadcrumbItems.push({ label: modelName, link: `/admin/core/${segments[2]}/${segments[3]}` });
            }
        }

        // 6th segment: If in "form/[id]" mode, show the final value or ID
        if (segments.length === 6 && segments[4] === "form") {
            breadcrumbItems.push({ label: queryUserKeyField || segments[5] });
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