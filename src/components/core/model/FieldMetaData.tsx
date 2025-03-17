'use client';
import { usePathname } from "next/navigation";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { useMountEffect } from "primereact/hooks";
import { Messages } from "primereact/messages";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import FieldMetaDataForm from "./FieldMetaDataForm";


const FieldMetaData = ({ setIsDirty, modelMetaData, fieldMetaData, setFieldMetaData, deleteModelFunction, nextTab, formikFieldsMetadataRef, params }: any) => {
  const pathname = usePathname();
  const msgs = useRef<Messages>(null);

  useMountEffect(() => {
    if (msgs.current) {
      msgs.current.clear();
      msgs.current.show({
        id: '1',
        sticky: true,
        severity: 'info',
        detail: `Please select Module and Datasource from the models Tab.`,
        closable: false,
      });
    }
  });
  const toast = useRef<Toast>(null);
  const [visiblePopup, setVisiblePopup] = useState(false);
  const [isRequiredPopUp, setIsRequiredPopUp] = useState(false);
  const [currentPopup, setCurrentPopup] = useState();
  const [selectedFieldMetaData, setSelectedFieldMetaData] = useState(null);
  const onRowSelect = (event: any) => {
    setVisiblePopup(true);

  };

  // Template for the pencil icon column
  const editTemplate = (rowData: any) => {
    return (
      <>

        {rowData.isSystem !== true &&
          <Button
            icon="pi pi-pencil"
            text
            onClick={() => {
              setSelectedFieldMetaData(rowData);
              setVisiblePopup(true);
            }}
            size="small"
          />
        }
      </>
    )
  };

  // Function to delete a row
  const deleteRow = (rowData: any) => {
    setFieldMetaData((prevData: any) => prevData.filter((item: any) => item.name !== rowData.name)); // Remove the row from the data array
  };

  // Template for the trash (delete) icon column
  const deleteTemplate = (rowData: any) => {
    return (
      <>
        {(pathname.includes('create') || rowData.isSystem !== true) &&
          <Button icon="pi pi-trash" text severity="danger" onClick={() => deleteRow(rowData)} size="small" />

        }
      </>
    )
  };

  const showToaster = async (message: any, severity: any) => {
    const errorMessages = Object.values(message);
    if (errorMessages.length > 0) {
      toast?.current?.show({
        severity: severity,
        summary: "Can you send me the report?",
        life: 3000,
        //@ts-ignore
        content: (props) => (
          <div
            className="flex flex-column align-items-left"
            style={{ flex: "1" }}
          >
            {errorMessages.map((m, index) => (
              <div className="flex align-items-center gap-2" key={index}>
                <span className="font-bold text-900">{String(m)}</span>
              </div>
            ))}
          </div>
        ),
      });
    }
  };



  return (
    <>

      {!modelMetaData.moduleId || !modelMetaData.dataSource ?
        <div className="card flex justify-content-center">
          <Messages ref={msgs} />
        </div>
        :
        <div>
          <div className="flex justify-content-end mb-4">
            {/* <h3>All Fields</h3> */}
            {modelMetaData.isSystem !== true &&
              <Button
                label="Add"
                // icon="pi pi-external-link"
                onClick={() => {
                  if (!modelMetaData?.dataSourceType) {
                    toast.current?.show({
                      severity: 'error',
                      summary: 'Error',
                      detail: 'Orm Type is required!',
                      life: 3000,
                    });
                  } else {
                    setSelectedFieldMetaData(null);
                    setVisiblePopup(true)
                  }
                }} size="small"
              />
            }
          </div>
          <DataTable value={fieldMetaData} dataKey="id"
            tableStyle={{ minWidth: '50rem' }} size="small">
            <Column field="displayName" header="Display Name" headerClassName="table-header-fs"></Column>
            <Column field="name" header="Name" headerClassName="table-header-fs"></Column>
            <Column field="type" header="Type" headerClassName="table-header-fs"></Column>

            {modelMetaData.isSystem !== true &&
              <Column body={editTemplate} header="Edit" headerClassName="table-header-fs" style={{ width: '10%' }} />
            }
            {modelMetaData.isSystem !== true &&
              <Column body={deleteTemplate} header="Delete" headerClassName="table-header-fs" style={{ width: '10%' }} />
            }
          </DataTable>
          <Dialog
            header=""
            visible={visiblePopup}
            style={{ width: "40vw" }}
            className="solid-dialog"
            onHide={() => {
              if (!visiblePopup) return;

              setVisiblePopup(false);
            }}
            showHeader={false}
          >
            <FieldMetaDataForm setIsDirty={setIsDirty} modelMetaData={modelMetaData} fieldMetaData={selectedFieldMetaData} allFields={fieldMetaData} setFieldMetaData={setFieldMetaData} deleteModelFunction={deleteModelFunction} setVisiblePopup={setVisiblePopup} formikFieldsMetadataRef={formikFieldsMetadataRef} params={params} setIsRequiredPopUp={setIsRequiredPopUp} showToaster={showToaster}></FieldMetaDataForm>
          </Dialog>
          <Dialog
            visible={isRequiredPopUp}
            header={(
              <div className="flex align-items-center">
                <i className="pi pi-exclamation-triangle text-yellow-500 text-xl mr-2"></i>
                <span>Warning</span>
              </div>
            )}
            headerClassName="text-center"
            modal
            footer={() => (
              <div className="flex justify-content-center">
                <Button label="Ok" className='small-button' onClick={() => setIsRequiredPopUp(false)} />
              </div>
            )}
            onHide={() => setIsRequiredPopUp(false)}
            className="solid-dialog"
          >
            <p>If there is data against this model this operation might not work and manual intervention will be required</p>
          </Dialog>
        </div >
      }
    </>



  );
};
export default FieldMetaData;
