import { Download, FileSpreadsheet, MoveRight } from 'lucide-react';
import styles from './SolidImport.module.css'
import { useLazyGetImportInstructionsQuery } from '../../../../redux/api/importTransactionApi';
import { useEffect } from 'react';
import { getSession } from "../../../../adapters/auth/index";
import { ERROR_MESSAGES } from '../../../../constants/error-messages';
import { env } from "../../../../adapters/env";
import { SolidButton, SolidSpinner } from '../../../shad-cn-ui';

export const SolidImportInstructions = ({ setImportStep, listViewMetaData }: any) => {
    const [getImportInstructions, { data: importInstructionsData, isLoading, isError }] =
        useLazyGetImportInstructionsQuery();

    useEffect(() => {
        if (listViewMetaData && listViewMetaData?.data?.solidView?.model?.id) {
            getImportInstructions({ id: listViewMetaData?.data?.solidView?.model?.id });
        }
    }, [listViewMetaData, getImportInstructions]);

    const handleTemplateDownload = async (format: 'csv' | 'excel') => {
        const modelId = listViewMetaData?.data?.solidView?.model?.id;
        if (!modelId) return;
        try {
            const session: any = await getSession();
            const token = session?.user?.accessToken || "";
            if (!token) {
                throw new Error(ERROR_MESSAGES.NO_AUTH_TOKEN_FOUND);
            }
            const response = await fetch(
                `${env("API_URL")}/api/import-transaction/import-template/${modelId}/${format}`,
                {
                    method: 'GET',
                    headers: {
                        Authorization: `Bearer ${token}`,
                    }
                }
            );

            if (!response.ok) {
                throw new Error(ERROR_MESSAGES.FILE_DOWNLOAD_FAILED);
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = url;
            link.download = `import-template.${format === 'csv' ? 'csv' : 'xlsx'}`;
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error(ERROR_MESSAGES.DOWNLOAD_FAILED, error);
        }
    };

    const customInstructions = importInstructionsData?.data?.custom ?? [];
    const standardInstructions = importInstructionsData?.data?.standard ?? {};

    return (
        <div>
            <div className={styles.SolidImportContextWrapper}>
                {isLoading ? (
                    <div className="solid-import-loading-state">
                        <SolidSpinner size={22} label="Loading import instructions" />
                    </div>
                ) : isError ? (
                    <div className='solid-import-empty-state'>
                        <h4 className='text-center px-2'>Could not load import instructions</h4>
                        <p>Try again or continue if you already know the expected format.</p>
                    </div>
                ) : (
                    <div className={`solid-import-panel-grid ${customInstructions.length === 0 ? 'is-single-column' : ''}`}>
                        <div className={`solid-import-panel solid-import-panel-main ${customInstructions.length > 0 ? 'has-side-panel' : 'is-full-width'}`}>
                                <h5 className='solid-import-section-title'>Standard Instructions</h5>
                                <ol className='solid-import-instruction-list'>
                                    <li>
                                        <p className='solid-import-instruction-title'>Download a starter template</p>
                                        <div className='solid-import-template-actions'>
                                            <SolidButton type="button" variant="outline" size="sm" leftIcon={<Download size={14} />} onClick={() => handleTemplateDownload('csv')}>
                                                CSV Template
                                            </SolidButton>
                                            <SolidButton type="button" variant="outline" size="sm" leftIcon={<FileSpreadsheet size={14} />} onClick={() => handleTemplateDownload('excel')}>
                                                Excel Template
                                            </SolidButton>
                                        </div>
                                    </li>
                                    {(() => {
                                        return (
                                            Object.entries(standardInstructions as Record<string, string[]>)
                                                .map(([key, values]) => {
                                                    if (!values?.length) return null;

                                                    const titleCaseKey = key
                                                        .replace(/([A-Z])/g, ' $1')
                                                        .replace(/^./, str => str.toUpperCase());

                                                    const rendered = (
                                                        <li key={key} className='solid-import-instruction-item'>
                                                            <p className='solid-import-instruction-title'>
                                                                {titleCaseKey}
                                                            </p>
                                                            <div className='solid-import-instruction-copy solid-import-inline-token-list'>
                                                                {values.map((item: any, i) => (
                                                                    <span key={i} className='solid-import-inline-token'>
                                                                        {typeof item === 'string'
                                                                            ? item
                                                                            : item?.fieldName
                                                                                ? `${item.fieldName} (Regex: ${item.regexPattern})`
                                                                                : JSON.stringify(item)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </li>
                                                    );
                                                    return rendered;
                                                })
                                        );
                                    })()}
                                </ol>
                        </div>
                        {customInstructions.length > 0 &&
                            <div className='solid-import-panel solid-import-panel-side'>
                                <h5 className='solid-primary-black-text solid-import-section-title'>Custom Instructions</h5>
                                <div className='solid-import-instruction-copy'>
                                    {customInstructions.map((instruction: any, index: number) => (
                                        <p key={index} className='solid-import-custom-instruction'>
                                            {typeof instruction === "string" ? instruction : JSON.stringify(instruction)}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        }
                    </div>
                )}
            </div>
            <div className='solid-import-actions'>
                <p className="solid-import-actions-copy">Review the template guidance before uploading your file.</p>
                <SolidButton type="button" size='sm' onClick={() => setImportStep(2)} rightIcon={<MoveRight size={14} />}>
                    Continue
                </SolidButton>
            </div>
        </div>
    )
}
