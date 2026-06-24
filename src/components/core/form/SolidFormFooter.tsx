

import { useLazyNavigationQuery } from "../../../redux/api/modelApi";
import { useEffect, useState } from "react";
import qs from "qs";
import { setFilterObjectToLocalStorageByUrl, getFilterObjectFromLocalStorageByUrl } from "../list/SolidListView";
import { SolidFormViewProps } from "./SolidFormView";
import { usePathname } from "../../../hooks/usePathname";
import { useSearchParams } from "../../../hooks/useSearchParams";
import { useRouter } from "../../../hooks/useRouter";
import { SolidButton, SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from "../../shad-cn-ui";

export type SolidFormFooterProps = {
    params: SolidFormViewProps;
    internationalisationEnabled?: boolean;
};

type NavItem = {
    recordId: number;
    offset: number;
    limit: number;
};

export const SolidFormFooter = ({ params, internationalisationEnabled = false }: SolidFormFooterProps) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [prevNav, setPrevNav] = useState<NavItem | null>(null);
    const [nextNav, setNextNav] = useState<NavItem | null>(null);
    const [meta, setMeta] = useState<any>(null);

    const [triggerGetNavigation, { isLoading }] =
        useLazyNavigationQuery();

    const rewriteLocaleFilter = (filterNode: any, locale: string): any => {
        if (!filterNode || typeof filterNode !== "object") return filterNode;

        if (Array.isArray(filterNode)) {
            return filterNode.map((item) => rewriteLocaleFilter(item, locale));
        }

        const nextNode = { ...filterNode };

        if (Object.prototype.hasOwnProperty.call(nextNode, "localeName")) {
            const localeFilter = nextNode.localeName;

            if (localeFilter && typeof localeFilter === "object" && !Array.isArray(localeFilter)) {
                const updatedLocaleFilter: Record<string, any> = { ...localeFilter };
                Object.keys(updatedLocaleFilter).forEach((operator) => {
                    const operatorValue = updatedLocaleFilter[operator];
                    if (Array.isArray(operatorValue)) {
                        updatedLocaleFilter[operator] = [locale];
                    } else {
                        updatedLocaleFilter[operator] = locale;
                    }
                });
                nextNode.localeName = updatedLocaleFilter;
            } else {
                nextNode.localeName = locale;
            }
        }

        Object.keys(nextNode).forEach((key) => {
            if (key === "localeName") return;
            nextNode[key] = rewriteLocaleFilter(nextNode[key], locale);
        });

        return nextNode;
    };

    // -----------------------------
    // Helper: update local storage
    // -----------------------------
    const updatePaginationInLocalStorage = (offset: number, limit: number) => {
        const listPath = window.location.pathname.replace(
            /\/form\/[^/]+/,
            "/list",
        );
        const queryObject = getFilterObjectFromLocalStorageByUrl(listPath) || {};

        const updatedQueryObj = {
            ...queryObject,
            offset,
            limit,
        };
        setFilterObjectToLocalStorageByUrl(listPath, updatedQueryObj)
    };

    const getNewUrl = (recordId: number): string => {
        // Replace the id after /form/
        const newPathname = pathname.replace(
            /\/form\/[^/]+/,
            `/form/${recordId}`,
        );

        // Clone search params (immutable in Next.js)
        const params = new URLSearchParams(searchParams.toString());

        // Remove only userKeyField
        params.delete("userKeyField");

        const query = params.toString();
        return query ? `${newPathname}?${query}` : newPathname;
    }


    // -----------------------------
    // Click handlers
    // -----------------------------
    const handlePrev = () => {

        if (!prevNav) return;

        updatePaginationInLocalStorage(prevNav.offset, prevNav.limit);
        const newUrl = getNewUrl(prevNav.recordId)
        router.push(newUrl);
    };

    const handleNext = () => {
        if (!nextNav) return;

        updatePaginationInLocalStorage(nextNav.offset, nextNav.limit);
        const newUrl = getNewUrl(nextNav.recordId)
        router.push(newUrl);
    };

    // -----------------------------
    // Fetch navigation data
    // -----------------------------
    useEffect(() => {
        if (params.embeded === true) {
            setPrevNav(null);
            setNextNav(null);
            setMeta(null);
            return;
        }

        if (params.id !== "new") {

            const fetchNavigation = async () => {
                const listPath = window.location.pathname.replace(
                    /\/form\/[^/]+/,
                    "/list",
                );

                const queryObject = getFilterObjectFromLocalStorageByUrl(listPath);
                const defaultQueryObject = queryObject || {};
                const locale = searchParams.get("locale");
                const defaultEntityLocaleId = searchParams.get("defaultEntityLocaleId");
                const resolvedFilters = internationalisationEnabled && locale
                    ? rewriteLocaleFilter(defaultQueryObject.finalFullFilter || null, locale)
                    : (defaultQueryObject.finalFullFilter || null);

                const requiresPopulate =
                    Array.isArray(defaultQueryObject.sort) &&
                    defaultQueryObject.sort[0].split(":")[0].includes(".");
                const queryData = {
                    offset: defaultQueryObject.offset || 0,
                    limit: defaultQueryObject.limit || 25,
                    filters: resolvedFilters,
                    // fields: ["id"],
                    modelName: params.modelName,
                    recordId: params.id,
                    sort: defaultQueryObject.sort,
                    ...(requiresPopulate && {
                        populate: defaultQueryObject.populate,
                    }),
                };

                if (locale) {
                    queryData.locale = locale;
                }

                if (defaultEntityLocaleId && defaultEntityLocaleId !== "new") {
                    queryData.defaultEntityLocaleId = defaultEntityLocaleId;
                }

                const queryString = qs.stringify(queryData, {
                    encodeValuesOnly: true,
                });

                const response: any = await triggerGetNavigation(queryString).unwrap();
                if (response.statusCode == 200) {
                    setPrevNav(response?.data?.prev ?? null);
                    setNextNav(response?.data?.next ?? null);
                    setMeta(response?.data?.meta ?? null);
                }
            };
            fetchNavigation();
        }
    }, [params.id, params.embeded, params.modelName, searchParams, triggerGetNavigation]);

    // -----------------------------
    // UI
    // -----------------------------
    return (
        <div
            className="flex justify-end items-center gap-2 p-1"
        >{meta &&
            <span className="solid-form-footer-pagination-meta p-2">{`${meta.currentIndexGlobal} of ${meta.totalRecords}`}</span>
            }
            {prevNav && (
                <SolidTooltip>
                    <SolidTooltipTrigger asChild>
                        <SolidButton
                            icon="si si-angle-left"
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrev()}
                            disabled={isLoading}
                        />
                    </SolidTooltipTrigger>
                    <SolidTooltipContent side="top">Previous</SolidTooltipContent>
                </SolidTooltip>
            )}

            {nextNav && (
                <SolidTooltip>
                    <SolidTooltipTrigger asChild>
                        <SolidButton
                            icon="si si-angle-right"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleNext()}
                            disabled={isLoading}
                        />
                    </SolidTooltipTrigger>
                    <SolidTooltipContent side="top">Next</SolidTooltipContent>
                </SolidTooltip>
            )}
        </div>
    );
};
