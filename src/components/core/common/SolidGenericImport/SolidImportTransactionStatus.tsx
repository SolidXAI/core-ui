"use client"

import { getSession } from 'next-auth/react';
import { Button } from 'primereact/button';
import styles from './SolidImport.module.css'

export const SolidImportTransactionStatus = ({ importStatusResult, transactionId, setOpenImportDialog, handleFetchUpdatedRecords }: any) => {

  const handleSuccessSyncImport = () => {
    setTimeout(() => {
      setOpenImportDialog(false);
      setTimeout(() => {
        handleFetchUpdatedRecords();
      }, 150);
    }, 150);
  };

  const handleDownloadFailedRecords = async (transactionId: number) => {
    try {
      const session: any = await getSession();
      const token = session?.user?.accessToken || "";
      if (!token) {
        throw new Error('No auth token found');
      }
      const response = await fetch(
        `${process.env.API_URL}/api/import-transaction/${transactionId}/export-failed-import-records`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error('Failed to download');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;

      // Try to extract filename from Content-Disposition header
      const contentDisposition = response.headers.get("Content-Disposition");
      const match = contentDisposition?.match(/filename="(.+)"/);
      a.download = match?.[1] ?? "failed-records.xlsx"; // fallback if not found

      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
    }
  };

  
  return (
    <div>
      <div className={styles.SolidImportContextWrapper}>
        <div className='flex flex-column align-items-center mt-3 px-3 pt-3 pb-4'>
          <h4>
            {importStatusResult?.data?.status === "import_succeeded" &&
              "Import Successful"}

            {importStatusResult?.data?.status === "import_failed" &&
              (importStatusResult?.data?.importedIds?.length > 0
                ? "Import Completed with Some Failures"
                : "Import Failed – No Records Imported")}
          </h4>

          {importStatusResult?.data?.importedIds?.length > 0 && (
            <p>
              {importStatusResult.data.importedIds.length}{" "}
              {importStatusResult.data.importedIds.length === 1 ? "Record" : "Records"} Imported
            </p>
          )}
        </div>
      </div>
      <div className='mt-3 flex align-items-center gap-3'>
        {importStatusResult?.data?.importedIds.length > 0 &&
          <Button
            label='view Imported Records'
            size='small'
            onClick={() => handleSuccessSyncImport()}
          />
        }
        {importStatusResult?.data?.status === "import_failed" &&
          <Button
            label="Download Failed Records"
            size='small'
            icon="pi pi-download"
            outlined
            severity='contrast'
            onClick={() => handleDownloadFailedRecords(transactionId)}
          />
        }
      </div>
    </div>
  )
}