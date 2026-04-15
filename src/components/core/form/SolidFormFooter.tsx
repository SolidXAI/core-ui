

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
};

type NavItem = {
    recordId: number;
    offset: number;
    limit: number;
};

export const SolidFormFooter = ({ params }: SolidFormFooterProps) => {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [prevNav, setPrevNav] = useState<NavItem | null>(null);
    const [nextNav, setNextNav] = useState<NavItem | null>(null);
    const [meta, setMeta] = useState<any>(null);

    const [triggerGetNavigation, { isLoading }] =
        useLazyNavigationQuery();

    // -----------------------------
    // Helper: update local storage
    // -----------------------------
    const updatePaginationInLocalStorage = (offset: number, limit: number) => {
        const listPath = window.location.pathname.replace(
            /\/form\/[^/]+/,
            "/list",
        );
        const queryObject = getFilterObjectFromLocalStorageByUrl(listPath);

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
        if (params.id !== "new") {

            const fetchNavigation = async () => {
                const listPath = window.location.pathname.replace(
                    /\/form\/[^/]+/,
                    "/list",
                );

                const queryObject = getFilterObjectFromLocalStorageByUrl(listPath);

                const queryData = {
                    offset: queryObject.offset || 0,
                    limit: queryObject.limit || 25,
                    filters: queryObject.filters,
                    fields: ["id"],
                    modelName: params.modelName,
                    recordId: params.id,
                    sort: queryObject.sort
                };

                const queryString = qs.stringify(queryData, {
                    encodeValuesOnly: true,
                });

                const response: any = await triggerGetNavigation(queryString).unwrap();
                console.log("response nav", response);
                if (response.statusCode == 200) {
                    setPrevNav(response?.data?.prev ?? null);
                    setNextNav(response?.data?.next ?? null);
                    setMeta(response?.data?.meta ?? null);
                }
            };
            fetchNavigation();
        }
    }, [params.id]);

    // -----------------------------
    // UI
    // -----------------------------
    return (
        <div
            className="flex justify-content-end align-items-center gap-2 p-1"
        >{meta &&
            <span className="solid-form-footer-pagination-meta">{`${meta.currentIndexGlobal} of ${meta.totalRecords}`}</span>
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
