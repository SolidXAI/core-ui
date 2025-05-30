"use client";

import React, { useEffect, useState } from 'react';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Dropdown } from 'primereact/dropdown';
import styles from './SolidLocale.module.css'; // adjust path as needed
import { createSolidEntityApi } from '@/redux/api/solidEntityApi';
import { set } from 'lodash';

const SolidLocale = ({ solidFormViewMetaData, id, selectedLocale, setSelectedLocale,viewMode,createMode,handleLocaleChangeRedirect,
    applicableLocales,defaultEntityLocaleId }: { solidFormViewMetaData: any, id: string, selectedLocale: any, setSelectedLocale: any,viewMode:string,createMode:boolean,handleLocaleChangeRedirect:any,applicableLocales:any,defaultEntityLocaleId:string | null }) => {
    const [localeOptions, setLocaleOptions] = useState([]);
    useEffect(() => {
        if (!applicableLocales) return;

        // Prepare dropdown options
        const localeOptions = applicableLocales.map((x: any) => ({
            label: x.displayName,
            value: x.locale,
        }));
        setLocaleOptions(localeOptions);

        const defaultLocale = applicableLocales.find(
            (x: any) => x.isDefault === 'yes' && (createMode || x.defaultEntityLocaleId == id)
        );

        if (defaultLocale) {
            setSelectedLocale(defaultLocale.locale);
        }
    }, [applicableLocales, id, viewMode, createMode]);


    const handleLocaleChange = (e: any) => {
        const newLocale = e.value;
        if (newLocale === selectedLocale) return;
        setSelectedLocale(newLocale);
        const redirectLocaleId = id === 'new' ? defaultEntityLocaleId : (defaultEntityLocaleId || id);
        handleLocaleChangeRedirect(newLocale, redirectLocaleId, applicableLocales);
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
                    //TODO: disable if createMode is true
                    disabled={viewMode === 'view' || createMode}
                />
                {viewMode === 'view' || createMode && (
                    <div className="mt-4">
                        <p className="text-sm font-bold text-gray-500 mb-2">Note:</p>
                        <p className="text-sm text-gray-700">
                        you need to create entry in default locale.
                        </p>
                    </div>
                )} 
            </div>
            {/* <p className="text-sm font-bold text-gray-500 px-2">Fill in form another locale</p> */}
        </div>
    );
};

export default SolidLocale;
