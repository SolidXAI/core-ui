

import { usePathname } from "../../hooks/usePathname";
import { useRouter } from "../../hooks/useRouter";
import { useSearchParams } from "../../hooks/useSearchParams";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

interface BreadcrumbItem {
  label: string;
  link?: string;
}

interface Props {
  solidFormViewMetaData?: any;
  initialEntityData?: any;
}

const toTitleCase = (str: string) => {
  return str
    .replace(/[-_]/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const truncateText = (text: string, maxLength: number = 15) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

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
  const isNewForm = pathname.endsWith("/new");

  useEffect(() => {
    if (!isNewForm && userKeyFieldValue && !queryUserKeyField) {
      const params = new URLSearchParams(searchParams.toString());
      params.set("userKeyField", userKeyFieldValue);
      const newUrl = `${pathname}?${params.toString()}`;
      router.push(newUrl);
    }
  }, [pathname, userKeyFieldValue, queryUserKeyField, isNewForm, router]);

  const [fromView, setFromView] = useState<"list" | "kanban" | "card" | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedView = sessionStorage.getItem("fromView");
      if (storedView === "list" || storedView === "kanban" || storedView === "card") {
        setFromView(storedView);
      }
    }
  }, []);

  const breadcrumbItems: BreadcrumbItem[] = [];

  if (segments.length >= 4 && segments[0] === "admin" && segments[1] === "core") {
    const moduleName = segments[2];
    const modelName = segments[3];
    const modelDisplayName = modelMetadata?.displayName || toTitleCase(modelName);

    // Link to model list or kanban view based on stored view
    breadcrumbItems.push({
      label: modelDisplayName,
      link: `/admin/core/${moduleName}/${modelName}/${fromView || "list"}`,
    });

    breadcrumbItems.push({
      label: isNewForm
        ? `Add ${modelDisplayName} Details`
        : decodeURIComponent(queryUserKeyField || userKeyFieldValue || segments[segments.length - 1] || ""),
    });
  }

  return (
    <nav className="solid-breadcrumb" aria-label="Breadcrumb">
      <ol className="solid-breadcrumb-list">
        {breadcrumbItems.map((item, index) => {
          const fullLabel = item.label;
          const truncatedLabel = truncateText(fullLabel, 10);
          const shouldTruncate = fullLabel.length > 10;
          const isLast = index === breadcrumbItems.length - 1;

          const handleClick = () => {
            if (!item.link) return;
            if (typeof window !== "undefined") {
              const storedFullUrl = sessionStorage.getItem("fromViewUrl");
              if (storedFullUrl) {
                router.push(storedFullUrl);
                return;
              }
            }
            router.push(item.link);
          };

          return (
            <li key={`${item.label}-${index}`} className="solid-breadcrumb-item">
              {item.link ? (
                <button
                  type="button"
                  className="solid-breadcrumb-link"
                  onClick={handleClick}
                  title={shouldTruncate ? fullLabel : undefined}
                >
                  <span className={isLast ? "font-bold" : "font-normal"}>{truncatedLabel}</span>
                </button>
              ) : (
                <span className="solid-breadcrumb-current" title={shouldTruncate ? fullLabel : undefined}>
                  {truncatedLabel}
                </span>
              )}
              {!isLast ? <ChevronRight size={14} className="solid-breadcrumb-separator" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};
