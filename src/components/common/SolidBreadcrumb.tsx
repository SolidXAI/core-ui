"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { BreadCrumb } from "primereact/breadcrumb";
import { useEffect, useState } from "react";

interface BreadcrumbItem {
  label: string;
  link?: string;
}

interface Props {
  solidFormViewMetaData?: any;
  initialEntityData?: any;
}

export const SolidBreadcrumb = (props: Props) => {
  const { solidFormViewMetaData, initialEntityData } = props;
  const modelMetadata = solidFormViewMetaData?.data?.solidView?.model;
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const segments = pathname.split("/").filter(Boolean);

  let userKeyFieldValue: string | null = null;

  if (modelMetadata?.userKeyField) {
    const userKeyFieldName = modelMetadata.userKeyField.name;
    if (userKeyFieldName && initialEntityData?.[userKeyFieldName] !== undefined) {
      userKeyFieldValue = initialEntityData[userKeyFieldName];
    }
  }

  const queryUserKeyField = searchParams.get("userKeyField");

  useEffect(() => {
    if (segments.length === 6 && segments[4] === "form" && userKeyFieldValue && !queryUserKeyField) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("userKeyField", userKeyFieldValue);
      const newUrl = `${pathname}?${params.toString()}`;
      router.push(newUrl, { scroll: false });
    }
  }, [pathname, userKeyFieldValue, queryUserKeyField, router]);

  const [fromView, setFromView] = useState<"list" | "kanban" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedView = sessionStorage.getItem("fromView");
      console.log("📌 fromView loaded from sessionStorage:", storedView);
      if (storedView === "list" || storedView === "kanban") {
        setFromView(storedView);
      }
    }
  }, []);

  let breadcrumbItems: BreadcrumbItem[] = [];

  if (segments.length >= 4 && segments[0] === "admin" && segments[1] === "core") {
    const moduleName = segments[2].replace(/-/g, " ");
    const modelName = segments[3].replace(/-/g, " ");

    breadcrumbItems.push({
      label: moduleName,
      link: `/admin/core/${segments[2]}/home`,
    });

    if (segments.length >= 5) {
      if (segments[4] === "form" && segments.length === 6) {
        const view = fromView ?? "list";
        breadcrumbItems.push({
          label: view === "kanban" ? "Kanban" : "List",
          link: `/admin/core/${segments[2]}/${segments[3]}/${view}`,
        });
      } else {
        breadcrumbItems.push({
          label: modelName,
          link: `/admin/core/${segments[2]}/${segments[3]}`,
        });
      }
    }

    if (segments.length === 6 && segments[4] === "form") {
      breadcrumbItems.push({
        label: queryUserKeyField ? decodeURIComponent(queryUserKeyField) : segments[5],
      });
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