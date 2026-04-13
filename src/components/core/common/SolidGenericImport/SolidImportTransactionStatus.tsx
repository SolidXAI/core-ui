import { ERROR_MESSAGES } from '../../../../constants/error-messages';
import { getSession } from "../../../../adapters/auth/index";
import { AlertTriangle, CheckCircle2, CircleX, Download, Eye } from 'lucide-react';
import { useState } from 'react';
import { env } from "../../../../adapters/env";
import {
  SolidButton,
  SolidDialog,
  SolidDialogBody,
  SolidDialogClose,
  SolidDialogDescription,
  SolidDialogFooter,
  SolidDialogHeader,
  SolidDialogSeparator,
  SolidDialogTitle,
} from '../../../shad-cn-ui';

export const SolidImportTransactionStatus = ({ importStatusResult, transactionId, setOpenImportDialog, handleFetchUpdatedRecords }: any) => {

  const [showPartialDialog, setShowPartialDialog] = useState(false);

  const handleDownloadFailedRecords = async (transactionId: number) => {
    try {
      const session: any = await getSession();
      const token = session?.user?.accessToken || "";
      if (!token) {
        throw new Error(ERROR_MESSAGES.NO_AUTH_TOKEN_FOUND);
      }
      const response = await fetch(
        `${env("API_URL")}/api/import-transaction/${transactionId}/export-failed-import-records`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error(ERROR_MESSAGES.FAILED_TO_DOWNLOAD);

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
      console.error(ERROR_MESSAGES.DOWNLOAD_FAILED, error);
    }
  };

  const { status, failedCount = 0, importedCount = 0 } = importStatusResult?.data || {};

  const handleSuccessSyncImport = () => {
    setOpenImportDialog(false);
    setTimeout(() => {
      handleFetchUpdatedRecords();
    }, 150);
  };

  const handlePartialDialogConfirm = async () => {
    await handleDownloadFailedRecords(transactionId);
    setOpenImportDialog(false);
    setTimeout(() => {
      handleFetchUpdatedRecords();
    }, 150);
  };

  const getStatusTag = () => {
    if (status === "import_succeeded") {
      return (
        <div className="solid-import-status-pill is-success">
          <CheckCircle2 size={16} />
          <span>{importedCount} row{importedCount > 1 ? 's' : ''} imported successfully</span>
        </div>
      );
    }
    if (status === "import_failed" && importedCount === 0) {
      return (
        <div className="solid-import-status-pill is-danger">
          <CircleX size={16} />
          <span>Import Failed</span>
        </div>
      );
    }
    if (status === "import_failed" && importedCount > 0) {
      return (
        <div className="solid-import-status-pill is-warning">
          <AlertTriangle size={16} />
          <span>Completed with Some Errors</span>
        </div>
      );
    }
    return <div>Import Status</div>;
  };

  return (
    <div>
      <div className="solid-import-summary-card">
        <div className='solid-import-summary-card-header'>
          {getStatusTag()}
        </div>
        <div className='solid-import-summary-metrics'>
          <div className='solid-import-summary-metric'>
            <span>No. of Successful Rows</span> <span>{importedCount ?? 0}</span>
          </div>
          <div className='solid-import-summary-divider-wrap'>
            <div className='solid-import-summary-divider'></div>
          </div>
          <div className='solid-import-summary-metric'>
            <span>No. of Failed Rows</span> <span>{failedCount ?? 0}</span>
          </div>
        </div>
      </div>
      <div className='solid-import-actions'>
        <p className="solid-import-actions-copy">Review the result and open the updated records when you are ready.</p>
        {importedCount > 0 &&
          <SolidButton
            type='button'
            size='small'
            leftIcon={<Eye size={14} />}
            onClick={() => {
              if (status === "import_failed" && importedCount > 0) {
                setShowPartialDialog(true);
              } else {
                handleSuccessSyncImport();
              }
            }
            }
          >
            View Imported Records
          </SolidButton>
        }
        {status === "import_failed" && transactionId &&
          <SolidButton
            type='button'
            size='small'
            leftIcon={<Download size={14} />}
            variant='outline'
            onClick={() => handleDownloadFailedRecords(transactionId)}
          >
            Download Failed Records
          </SolidButton>
        }
      </div>
      <SolidDialog
        open={showPartialDialog}
        onOpenChange={setShowPartialDialog}
        style={{ width: 'min(460px, calc(100vw - 2rem))' }}
        className="solid-import-confirm-dialog"
      >
        <SolidDialogHeader className="solid-filter-dialog-head">
          <div>
            <SolidDialogTitle className="solid-filter-dialog-title m-0">View Imported Records</SolidDialogTitle>
            <SolidDialogDescription className="solid-filter-dialog-subtitle m-0">
              Failed rows can be downloaded before you return to the imported results.
            </SolidDialogDescription>
          </div>
          <SolidDialogClose className="solid-filter-dialog-close" />
        </SolidDialogHeader>
        <SolidDialogSeparator className="solid-filter-dialog-sep" />
        <SolidDialogBody className="solid-import-confirm-dialog-body">
          <p>Do you want to download failed records before viewing the successful imports?</p>
        </SolidDialogBody>
        <SolidDialogFooter className="solid-import-confirm-dialog-footer">
          <SolidButton type="button" size='small' leftIcon={<Download size={14} />} onClick={handlePartialDialogConfirm}>
            Yes
          </SolidButton>
          <SolidButton
            type="button"
            size='small'
            variant="outline"
            leftIcon={<CircleX size={14} />}
            onClick={() => {
              handleSuccessSyncImport();
            }}
          >
            No
          </SolidButton>
        </SolidDialogFooter>
      </SolidDialog>
    </div>
  )
}
