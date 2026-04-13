import { usePathname } from "../../../hooks/usePathname";
import { SolidDataTable as DataTable, Column } from "../list/SolidDataTable";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { showToast } from "../../../redux/features/toastSlice";
import FieldMetaDataForm from "./FieldMetaDataForm";
import { ERROR_MESSAGES } from "../../../constants/error-messages";
import { AlertTriangle, Info, Pencil, Plus, Trash2 } from "lucide-react";
import {
  SolidButton,
  SolidDialog,
  SolidDialogBody,
  SolidDialogFooter,
} from "../../shad-cn-ui";


const FieldMetaData = ({ setIsDirty, modelMetaData, fieldMetaData, setFieldMetaData, deleteModelFunction, nextTab, formikFieldsMetadataRef, params }: any) => {
  const pathname = usePathname();
  const dispatch = useDispatch();
  const [visiblePopup, setVisiblePopup] = useState(false);
  const [isRequiredPopUp, setIsRequiredPopUp] = useState(false);
  const [currentPopup, setCurrentPopup] = useState();
  const [selectedFieldMetaData, setSelectedFieldMetaData] = useState(null);
  const [deleteAlertPopup, setDeleteAlertPopup] = useState(false);
  const [rowToDelete, setRowToDelete] = useState<any>(null);
  const onRowSelect = (event: any) => {
    setVisiblePopup(true);

  };

  // Template for the pencil icon column
  const editTemplate = (rowData: any) => {
    return (
      <>

        {rowData.isSystem !== true && rowData.isMarkedForRemoval !== true &&
          <SolidButton
            variant="ghost"
            size="sm"
            className="solid-icon-button"
            aria-label="Edit field"
            leftIcon={<Pencil size={14} />}
            onClick={() => {
              setSelectedFieldMetaData(rowData);
              setVisiblePopup(true);
            }}
          />
        }
      </>
    )
  };
  const bodyTemplate = (rowData: any) => {
    return (
      <>

        {rowData.displayName &&
          <>
            <p>{rowData.displayName}
              {rowData.isMarkedForRemoval === true &&
                <>
                  <br></br>  <span style={{ fontSize: '11px', color: 'red' }}>This field will be removed next time you generate code for this model.</span>
                </>
              }
            </p>
          </>
        }
      </>
    )
  };


  // Function to delete a row
  const deleteRow = (rowData: any) => {
    //show dialog bbefore deletion & which will have to option ok and cancel
    setFieldMetaData((prevData: any) => {
      const updatedData = prevData.filter((item: any) => item.name !== rowData.name);
      setIsDirty(true); // Ensure dirty state is updated immediately
      return updatedData;
    });
  };

  // Template for the trash (delete) icon column
  const deleteTemplate = (rowData: any) => {
    return (
      <>
        {(pathname.includes('create') || (rowData.isSystem !== true && rowData.isMarkedForRemoval !== true)) &&
          <SolidButton
            variant="ghost"
            size="sm"
            className="solid-icon-button"
            style={{ color: "var(--solid-danger, #ef4444)" }}
            aria-label="Delete field"
            leftIcon={<Trash2 size={14} />}
            onClick={() => { setRowToDelete(rowData); setDeleteAlertPopup(true) }}
          />

        }
      </>
    )
  };

  const showToaster = async (message: any, severity: any) => {
    const errorMessages = Object.values(message);
    if (errorMessages.length > 0) {
      dispatch(showToast({ severity, summary: ERROR_MESSAGES.SEND_REPORT, detail: errorMessages.map(String).join(', '), life: 3000 }));
    }
  };


  // const rowClass = (data: any) => {
  //   return {
  //     'bg-red-row': data.isMarkedForRemoval === true
  //   };
  // };


  const needsModelSetup = !modelMetaData.moduleId || !modelMetaData.dataSource;

  return (
    <>

      {needsModelSetup ?
        <div className="solid-placeholder-card-wrapper">
          <div className="solid-placeholder-card">
            <div className="solid-placeholder-card-icon">
              <Info size={18} />
            </div>
            <div className="solid-placeholder-card-body">
              <p className="solid-placeholder-card-title">Model setup incomplete</p>
              <p className="solid-placeholder-card-text">Please select Module and Datasource from the models tab before managing fields.</p>
            </div>
          </div>
        </div>
        :
        <>
          <div className="absolute" style={{ top: -3, right: 0 }}>
            {/* <h3>All Fields</h3> */}
            {modelMetaData.isSystem !== true &&
              <SolidButton
                size="sm"
                leftIcon={<Plus size={14} />}
                onClick={() => {
                  if (!modelMetaData?.dataSourceType) {
                    dispatch(showToast({ severity: 'error', summary: ERROR_MESSAGES.ERROR, detail: ERROR_MESSAGES.ORM_TYPE_REQUIRED }));
                  } else {
                    setSelectedFieldMetaData(null);
                    setVisiblePopup(true)
                  }
                }}
              >
                Add
              </SolidButton>
            }
          </div>
          <div className="solid-datatable-wrapper solid-list-table-area flex-1 min-h-0 overflow-hidden">
            <DataTable
              value={fieldMetaData}
              dataKey="id"
              size="small"
              emptyMessage="No fields configured"
              rowClassName={(rowData) => rowData.isMarkedForRemoval === true ? "greyed-out-row" : ""}
            >
              <Column field="displayName" header="Display Name" body={bodyTemplate}></Column>
              <Column field="name" header="Name"></Column>
              <Column field="type" header="Type"></Column>

              {modelMetaData.isSystem !== true &&
                <Column body={editTemplate} header="Edit" style={{ width: '80px' }} />
              }
              {modelMetaData.isSystem !== true &&
                <Column body={deleteTemplate} header="Delete" style={{ width: '90px' }} />
              }
            </DataTable>
          </div>
          <SolidDialog
            open={visiblePopup}
            onOpenChange={(open) => {
              if (!open) {
                setVisiblePopup(false);
              }
            }}
            className="solid-dialog solid-field-dialog"
            style={{ width: "30vw" }}
            showHeader={false}
          >
            <SolidDialogBody className="solid-dialog-body-flush">
              <FieldMetaDataForm setIsDirty={setIsDirty} modelMetaData={modelMetaData} fieldMetaData={selectedFieldMetaData} allFields={fieldMetaData} setFieldMetaData={setFieldMetaData} deleteModelFunction={deleteModelFunction} setVisiblePopup={setVisiblePopup} formikFieldsMetadataRef={formikFieldsMetadataRef} params={params} setIsRequiredPopUp={setIsRequiredPopUp} showToaster={showToaster}></FieldMetaDataForm>
            </SolidDialogBody>
          </SolidDialog>
          <SolidDialog
            open={isRequiredPopUp}
            onOpenChange={(open) => {
              if (!open) {
                setIsRequiredPopUp(false);
              }
            }}
            className="solid-dialog solid-confirm-dialog"
            style={{ width: "20vw" }}
            header={
              <div className="flex align-items-center gap-2">
                <AlertTriangle size={18} className="text-yellow-500" />
                <span>Warning</span>
              </div>
            }
          >
            <SolidDialogBody>
              <p className="mb-0">If there is data against this model this operation might not work and manual intervention will be required.</p>
            </SolidDialogBody>
            <SolidDialogFooter className="justify-content-start">
              <SolidButton size="sm" onClick={() => setIsRequiredPopUp(false)}>
                Ok
              </SolidButton>
            </SolidDialogFooter>
          </SolidDialog>
          <SolidDialog
            open={deleteAlertPopup}
            onOpenChange={(open) => {
              if (!open) {
                setDeleteAlertPopup(false);
                setRowToDelete(null);
              }
            }}
            className="solid-dialog solid-confirm-dialog"
            style={{ width: "20vw" }}
            header={
              <div className="flex align-items-center justify-content-center gap-2">
                <AlertTriangle size={18} className="text-yellow-500" />
                <span>Warning</span>
              </div>
            }
          >
            <SolidDialogBody>
              <p className="mb-0 text-center">Are you sure you want to delete this field?</p>
            </SolidDialogBody>
            <SolidDialogFooter className="flex justify-content-center gap-2">
              <SolidButton
                size="sm"
                onClick={() => {
                  if (rowToDelete) {
                    deleteRow(rowToDelete);
                  }
                  setDeleteAlertPopup(false);
                  setRowToDelete(null);
                }}
              >
                Ok
              </SolidButton>
              <SolidButton
                size="sm"
                variant="outline"
                onClick={() => {
                  setDeleteAlertPopup(false);
                  setRowToDelete(null);
                }}
              >
                Cancel
              </SolidButton>
            </SolidDialogFooter>
          </SolidDialog>

        </>
      }
    </>



  );
};
export default FieldMetaData;
