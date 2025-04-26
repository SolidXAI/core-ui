"use client";
import { useFormik } from "formik";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useRef, useState } from "react";
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { TabPanel, TabView } from "primereact/tabview";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
interface FieldMetadata {
  displayName: string;
}

interface FilterColumns {
  name: string;
  key: string;
}

type SolidExportProps = {
  listViewMetaData: any; // replace `any` with the correct type if you have it
};
// Define the template option type
interface TemplateOption {
  name: string;
  code: string;
}
interface Question {
  key: string;
  name: string;
}
export const SolidExport = ({ listViewMetaData, setExportView }: any) => {
  const toast = useRef<Toast>(null);
  const entityApi = createSolidEntityApi("userViewMetadata");
  const { useUpsertSolidEntityMutation } = entityApi;

  const [upsertUserView] = useUpsertSolidEntityMutation();

  if (!listViewMetaData?.data) return null;

  const solidView = listViewMetaData.data.solidView;
  const solidFieldsMetadata = listViewMetaData.data.solidFieldsMetadata as Record<
    string,
    FieldMetadata
  >;
  if (!solidView || !solidFieldsMetadata) return null;

  const checkedFieldNames = new Set(
    solidView.layout.children.map((col: { attrs: { name: string } }) => col.attrs.name)
  );

  const allColumns: FilterColumns[] = Object.entries(solidFieldsMetadata).map(
    ([key, field]) => ({
      name: field.displayName,
      key,
    })
  );
  console.log("solidFieldsMetadata", solidFieldsMetadata);
  console.log("allColumns", allColumns);

  const formik = useFormik({
    initialValues: {
      selectedColumns: allColumns.filter((col) => checkedFieldNames.has(col.key)),
    },
    onSubmit: async (values) => {
      const selectedKeys = values.selectedColumns.map((col) => col.key);
      const currentChildren = solidView.layout.children;

      const newChildren = selectedKeys.map((key) => {
        const existingChild = currentChildren.find((child: any) => child.attrs.name === key);
        return existingChild || {
          type: "field",
          attrs: {
            name: key,
            label: solidFieldsMetadata[key]?.displayName || key,
            sortable: true,
            filterable: true,
          },
        };
      });

      const updatedView = {
        layout: {
          ...solidView.layout,
          children: newChildren,
        },
      };

      try {
        if (solidView?.id) {
          const response = await upsertUserView({
            viewMetadataId: solidView.id,
            layout: JSON.stringify(updatedView.layout),
          }).unwrap();
          if (response.statusCode === 200) {
            toast.current?.show({
              severity: "success",
              summary: "Success",
              detail: "Layout updated",
              life: 3000,
            });
            window.location.reload();
          }
        }
      } catch (error) {
        console.error("Update error:", error);
      }
    },
  });

  const { selectedColumns } = formik.values;

  const availableColumns = allColumns.filter(
    (col) => !selectedColumns.some((selected) => selected.key === col.key)
  );

  const moveToSelected = (col: FilterColumns) => {
    formik.setFieldValue("selectedColumns", [...selectedColumns, col]);
  };

  const moveToAvailable = (col: FilterColumns) => {
    formik.setFieldValue("selectedColumns", selectedColumns.filter((c) => c.key !== col.key));
  };

  const items = [
    {
      label: "Excel",
      icon: "pi pi-refresh",
      command: () => {
        toast?.current?.show({
          severity: "success",
          summary: "Updated",
          detail: "Data Updated",
        });
      },
    },
    {
      label: "CSV",
      icon: "pi pi-times",
      command: () => {
        // toast.current.show({ severity: 'warn', summary: 'Delete', detail: 'Data Deleted' });
      },
    },
  ];

  const save = () => {
    toast?.current?.show({
      severity: "success",
      summary: "Success",
      detail: "Data Saved",
    });
  };

  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<TemplateOption>({name: "CSV Export", code: "csv"});
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([
    { name: "Template 1", code: "t1" },
    { name: "Template 2", code: "t2" },
  ]);
  const [formatOptions, setFormatOptions] = useState<TemplateOption[]>([
    { name: "CSV Export", code: "csv" },
    { name: "Excel Export", code: "excel" },
  ]);
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  
    // Handle adding a new template
    const handleAddTemplate = () => {
      if (newTemplateName.trim()) {
        const newCode = `t${templateOptions.length + 1}`; // Generate unique code
        const newTemplate: TemplateOption = {
          name: newTemplateName.trim(),
          code: newCode,
        };
        setTemplateOptions([...templateOptions, newTemplate]);
        setNewTemplateName(""); // Reset input
        setIsDialogVisible(false); // Close dialog
      }
    };
  const panelFooterTemplate = () => (
    <div className="p-1">
      <Button
        label="Add New Template"
        icon="pi pi-plus"
        className="p-button"
        onClick={() => setIsDialogVisible(true)}
      />
    </div>
  );

  // Dialog footer (Save and Cancel buttons)
  const dialogFooter = (
    <div>
       <Button
        label="Save"
        className="p-button rounded"
        onClick={handleAddTemplate}
        disabled={!newTemplateName.trim()}
      />
      <Button
        label="Cancel"
        className="e-cancel rounded"
        onClick={() => {
          setNewTemplateName("");
          setIsDialogVisible(false);
        }}
      />
    </div>
  );
  const handleExport = () => {
    console.log("Exporting with format:", selectedFormat);
    console.log("Exporting with template:", selectedTemplate);  
    toast?.current?.show({
      severity: 'success',
      summary: 'Export Initiated',
      detail: `Exporting as ${selectedTemplate?.name}`,
      life: 3000,
    });
  };
     const renderSourceItem = (item: Question) => (
          <div key={item.key} className="solid-picklist-item-wrapper solid-picklist-source-item">
              <div className="flex items-center gap-2">
                  <svg onClick={() => moveToSelected(item)} width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g opacity="0.4">
                        <rect x="0.5" y="0.5" width="15" height="15" rx="3.5" fill="white" stroke="#D9D9D9"/>
                        <path d="M7.42857 8.57143H4V7.42857H7.42857V4H8.57143V7.42857H12V8.57143H8.57143V12H7.42857V8.57143Z" fill="#4B4D52"/>
                        </g>
                        </svg>
                  <label htmlFor={item.key} className="ml-2 solid-picklist-item-content">
                      {item.name}
                  </label>
              </div>
          </div>
      );
  
      const renderTargetItem = (item: Question) => (
          <div key={item.key} className="solid-picklist-item-wrapper gap-2">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M7.46672 11.7331C7.46672 12.0997 7.33616 12.4136 7.07505 12.6747C6.81394 12.9359 6.50005 13.0664 6.13338 13.0664C5.76672 13.0664 5.45283 12.9359 5.19172 12.6747C4.9306 12.4136 4.80005 12.0997 4.80005 11.7331C4.80005 11.3664 4.9306 11.0525 5.19172 10.7914C5.45283 10.5303 5.76672 10.3997 6.13338 10.3997C6.50005 10.3997 6.81394 10.5303 7.07505 10.7914C7.33616 11.0525 7.46672 11.3664 7.46672 11.7331ZM7.46672 7.73307C7.46672 8.09974 7.33616 8.41363 7.07505 8.67474C6.81394 8.93585 6.50005 9.06641 6.13338 9.06641C5.76672 9.06641 5.45283 8.93585 5.19172 8.67474C4.9306 8.41363 4.80005 8.09974 4.80005 7.73307C4.80005 7.36641 4.9306 7.05252 5.19172 6.79141C5.45283 6.5303 5.76672 6.39974 6.13338 6.39974C6.50005 6.39974 6.81394 6.5303 7.07505 6.79141C7.33616 7.05252 7.46672 7.36641 7.46672 7.73307ZM7.46672 3.73307C7.46672 4.09974 7.33616 4.41363 7.07505 4.67474C6.81394 4.93585 6.50005 5.06641 6.13338 5.06641C5.76672 5.06641 5.45283 4.93585 5.19172 4.67474C4.9306 4.41363 4.80005 4.09974 4.80005 3.73307C4.80005 3.36641 4.9306 3.05252 5.19172 2.79141C5.45283 2.5303 5.76672 2.39974 6.13338 2.39974C6.50005 2.39974 6.81394 2.5303 7.07505 2.79141C7.33616 3.05252 7.46672 3.36641 7.46672 3.73307Z" fill="black" fill-opacity="0.25"/>
                <path d="M11.7333 11.7331C11.7333 12.0997 11.6028 12.4136 11.3417 12.6747C11.0805 12.9359 10.7667 13.0664 10.4 13.0664C10.0333 13.0664 9.71943 12.9359 9.45832 12.6747C9.19721 12.4136 9.06665 12.0997 9.06665 11.7331C9.06665 11.3664 9.19721 11.0525 9.45832 10.7914C9.71943 10.5303 10.0333 10.3997 10.4 10.3997C10.7667 10.3997 11.0805 10.5303 11.3417 10.7914C11.6028 11.0525 11.7333 11.3664 11.7333 11.7331ZM11.7333 7.73307C11.7333 8.09974 11.6028 8.41363 11.3417 8.67474C11.0805 8.93585 10.7667 9.06641 10.4 9.06641C10.0333 9.06641 9.71943 8.93585 9.45832 8.67474C9.19721 8.41363 9.06665 8.09974 9.06665 7.73307C9.06665 7.36641 9.19721 7.05252 9.45832 6.79141C9.71943 6.5303 10.0333 6.39974 10.4 6.39974C10.7667 6.39974 11.0805 6.5303 11.3417 6.79141C11.6028 7.05252 11.7333 7.36641 11.7333 7.73307ZM11.7333 3.73307C11.7333 4.09974 11.6028 4.41363 11.3417 4.67474C11.0805 4.93585 10.7667 5.06641 10.4 5.06641C10.0333 5.06641 9.71943 4.93585 9.45832 4.67474C9.19721 4.41363 9.06665 4.09974 9.06665 3.73307C9.06665 3.36641 9.19721 3.05252 9.45832 2.79141C9.71943 2.5303 10.0333 2.39974 10.4 2.39974C10.7667 2.39974 11.0805 2.5303 11.3417 2.79141C11.6028 3.05252 11.7333 3.36641 11.7333 3.73307Z" fill="black" fill-opacity="0.25"/>
              </svg>
              <span className="solid-picklist-item-content flex-1">{item.name}</span>
              <svg width="16" height="16"  onClick={() => moveToAvailable(item)} cursor='pointer' viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <rect width="16" height="16" rx="8" fill="#F0F0F0"/>
                        <path d="M5.6 11L5 10.4L7.4 8L5 5.6L5.6 5L8 7.4L10.4 5L11 5.6L8.6 8L11 10.4L10.4 11L8 8.6L5.6 11Z" fill="#4B4D52"/>
              </svg>
          </div>
      );
          // Get max row count to ensure both columns match height
    const maxVisibleRows = Math.max(availableColumns.length, selectedColumns.length);
    const renderEmptyRow = (index: number) => (
      <div key={`empty-${index}`} className="solid-picklist-item-wrapper" />
  );
  return (
    <>
      <Toast ref={toast} />
        <TabView activeIndex={activeIndex} onTabChange={(e) => setActiveIndex(e.index)} className="export-tabview">
          <TabPanel header="Export">
            <div className="solid-export-controls gap-2">
              {/* <SplitButton label="Format" model={splitButtonItems} onClick={handleExport} className="p-mr-2" /> */}
              <Dropdown
                value={selectedFormat}
                onChange={(e) => setSelectedFormat(e.value)}
                options={formatOptions}
                optionLabel="name"
                placeholder="Select format"
                className="p-dropdown"
              />
              <Dropdown
                value={selectedTemplate}
                onChange={(e) => setSelectedTemplate(e.value)}
                options={templateOptions}
                optionLabel="name"
                placeholder="Template"
                className="p-dropdown"
                panelFooterTemplate={panelFooterTemplate}
              />
              <Button 
              className="p-button" 
              label="Export"
              disabled={false}
              onClick={handleExport}
              visible={selectedTemplate !== null}
              />
               <Dialog
                header="Save Export Template"
                visible={isDialogVisible}
                style={{ width: "25rem"  }}
                footer={dialogFooter}
                onHide={() => {
                  setNewTemplateName("");
                  setIsDialogVisible(false);
                }}
              >
                  <label htmlFor="templateName mb-1">Title</label>
                  <InputText
                    id="templateName"
                    value={newTemplateName}
                    onChange={(e) => setNewTemplateName(e.target.value)}
                    placeholder="Enter template name"
                    className="w-full"
                    autoFocus
                  />
              </Dialog>
            </div>

            <div className="solid-custom-picklist mt-2">
                        <div className="flex">
                            {/* All Questions */}
                            <div className="w-6">
                                <div className="solid-picklist-header solid-source-picklist-header">All Questions</div>
                                <div>
                                    {availableColumns.map(renderSourceItem)}
                                    {Array.from({ length: maxVisibleRows - availableColumns.length }).map((_, i) =>
                                        renderEmptyRow(i)
                                    )}
                                </div>
                            </div>

                            {/* Selected Questions */}
                            <div className="w-6">
                                <div className="solid-picklist-header">Selected Questions</div>
                                <div>
                                    {selectedColumns.map(renderTargetItem)}
                                    {Array.from({ length: maxVisibleRows - selectedColumns.length }).map((_, i) =>
                                        renderEmptyRow(i)
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
          </TabPanel>
          <TabPanel header="Summary">
            <p className="m-0">
              Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium
              doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore
              veritatis et quasi architecto beatae vitae dicta sunt explicabo. Nemo enim ipsam
              voluptatem quia voluptas sit aspernatur aut odit aut fugit, sed quia consequuntur
              magni dolores eos qui ratione voluptatem sequi nesciunt. Consectetur, adipisci
              velit, sed quia non numquam eius modi.
            </p>
          </TabPanel>
        </TabView>
    </>
  );
};