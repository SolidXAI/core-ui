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


const FieldMetaData = ({ modelMetaData, fieldMetaData, setFieldMetaData, deleteModelFunction, nextTab, formikFieldsMetadataRef }: any) => {
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
            onClick={() => {
              setSelectedFieldMetaData(rowData);
              setVisiblePopup(true);
            }}
            className="p-button-rounded p-button-text"
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
          <Button icon="pi pi-trash" onClick={() => deleteRow(rowData)} className="p-button-rounded p-button-danger p-button-text" />

        }
      </>
    )
  };



  return (
    <>

      {!modelMetaData.moduleId ?
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
                className="small-button"
              />
            }
          </div>
          <div className="card">
            <DataTable value={fieldMetaData} dataKey="id"
              tableStyle={{ minWidth: '50rem' }} size="small" className="custom-table" rowClassName={() => 'custom-row-height'}>
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
          </div>
          <Dialog
            className="field-poopup-container"
            header=""
            visible={visiblePopup}
            style={{ width: "40vw" }}
            contentStyle={{ borderRadius: 8 }}
            onHide={() => {
              if (!visiblePopup) return;

              setVisiblePopup(false);
            }}
            showHeader={false}
          >
            <FieldMetaDataForm modelMetaData={modelMetaData} fieldMetaData={selectedFieldMetaData} allFields={fieldMetaData} setFieldMetaData={setFieldMetaData} deleteModelFunction={deleteModelFunction} setVisiblePopup={setVisiblePopup} formikFieldsMetadataRef={formikFieldsMetadataRef} ></FieldMetaDataForm>
          </Dialog>

        </div >
      }
    </>



  );
};

export default FieldMetaData;
