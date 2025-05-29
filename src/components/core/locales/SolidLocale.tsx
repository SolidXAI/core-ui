import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Dropdown } from 'primereact/dropdown';
import styles from './SolidLocale.module.css'; // adjust path as needed
// import { useGetLocalesQuery } from '@/redux/api/localeApi';
// import { Button } from 'primereact/button';
import { createSolidEntityApi } from '@/redux/api/solidEntityApi';

const SolidLocale = ({ solidFormViewMetaData, id, selectedLocale, setSelectedLocale }: { solidFormViewMetaData: any, id: string, selectedLocale: any, setSelectedLocale: any }) => {
    // const [selectedLocale, setSelectedLocale] = useState(initialSelectedLocale || null);
    const entityApi = createSolidEntityApi('locale');
    const {
        useCreateSolidEntityMutation: useCreateLocaleMutation,
        useDeleteSolidEntityMutation: useDeleteLocaleMutation,
        useGetSolidEntitiesQuery: useGetLocalesQuery,
        useGetSolidEntityByIdQuery: useGetLocaleByIdQuery,
        useUpdateSolidEntityMutation: useUpdateLocaleMutation
    } = entityApi;

    const { data: locales } = useGetLocalesQuery({});

    const [localeOptions, setLocaleOptions] = useState([]);

    useEffect(() => {
        console.log("SolidLocale component mounted with id:", id);
        console.log("SolidFormViewMetaData:", solidFormViewMetaData);
        console.log("Locales data:", locales);
        //convert locales to options for dropdown
        if (locales && locales.records) {
            const localeOptions = locales.records.map((x: any) => ({
                label: x.displayName,
                value: x.locale
            }));
            setLocaleOptions(localeOptions);
            if (selectedLocale === null || selectedLocale === undefined) {
                setSelectedLocale(localeOptions[0]?.value || null); // Set default locale if available
            }
            //  setSelectedLocale(localeOptions[0]?.value || null); // Set default locale if available
        }
    }, [locales]);

    const handleLocaleChange = (e: any) => {
        console.log(e);
        console.log("Selected locale:", e.value);
        setSelectedLocale(e.value);
    };

    // utils/formatDate.ts
    function formatToDDMMYY(dateString: string): string {
        if (!dateString) return 'Draft'; // Handle empty date string
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0'); // Month is zero-based
        const year = String(date.getFullYear()).slice(-2); // Get last two digits
        return `${day}-${month}-${year}`;
    }

    return (
        <div className={styles.solidLocaleContainer}>
            <div className={styles.solidLocaleCardHeader}>
                {solidFormViewMetaData.data.solidView?.model?.draftPublishWorkflow &&
                    solidFormViewMetaData.data.solidView?.model?.publishedAt !== null ?
                    <p className="text-primary">Editing published version</p> : <p className="text-primary">Editing unpublished version</p>}
            </div>
            <div className={styles.solidLocaleCardBody}>
                <h3 className="text-lg font-semibold p-0 m-0">Information</h3>
                <Divider className="my-2" />
                <div className="space-y-2">
                    <div className={styles.solidLocaleInfoField}>
                        <p className="text-sm font-bold text-gray-500 m-0">Created At</p>
                        <p className="text-sm m-0">{formatToDDMMYY(solidFormViewMetaData.data.solidView?.model?.createdAt)}</p>
                    </div>
                    <div className={styles.solidLocaleInfoField}>
                        <p className="text-sm font-bold text-gray-500 m-0">Published At</p>
                        <p className="text-sm m-0">{formatToDDMMYY(solidFormViewMetaData.data.solidView?.model?.publishedAt)}</p>
                    </div>
                    <div className={styles.solidLocaleInfoField}>
                        <p className="text-sm font-bold text-gray-500 m-0">Updated At</p>
                        <p className="text-sm m-0">
                            {formatToDDMMYY(solidFormViewMetaData.data.solidView?.model?.updatedAt)}
                        </p>
                    </div>
                </div>
                <h3 className="text-lg font-semibold mt-6 mb-2">Internationalisation</h3>

                <label className="form-field-label">Locales</label>
                <Dropdown
                    value={selectedLocale}
                    onChange={(e) => handleLocaleChange(e)}
                    options={localeOptions}
                    optionLabel="label"
                    placeholder="Select locale"
                    className="w-full"
                />
            </div>
            {/* <p className="text-sm font-bold text-gray-500 px-2">Fill in form another locale</p> */}
        </div>
    );
};

export default SolidLocale;
