"use client";
import { useFormik } from "formik";
import { Button } from "primereact/button";
import { Toast } from "primereact/toast";
import { useEffect, useRef, useState } from "react";
import { createSolidEntityApi } from "@/redux/api/solidEntityApi";
import { Dropdown } from "primereact/dropdown";
import { Dialog } from "primereact/dialog";
import { InputText } from "primereact/inputtext";
import { useCreateExportTemplateMutation, useGetExportTemplatesQuery } from "@/redux/api/exportTemplateApi";
import { downloadFileWithProgress } from "../../helpers/downloadFileWithProgress";
import { DownloadProgressToast } from "./DownloadProgressToast";
import { SolidExportStepper } from "./SolidExportStepper";
import * as XLSX from 'xlsx';
interface FieldMetadata {
  displayName: string;
}
interface FilterColumns {
  name: string;
  key: string;
}
// Define the template option type
interface TemplateOption {
  name: string;
  code: string;
  fields: string[];
  templateFormat: string;
}
interface FormatOption {
  name: string;
  code: string;
  icon?: JSX.Element;
}
interface Question {
  key: string;
  name: string;
}

type Field = {
  name: string;
  displayName?: string;
  required?: boolean;
  type?: string;
};
type FieldGroups = {
  [key: string]: string[]; // key is field type, value is array of field display names
};

type FileData = {
  fileName: string;
  data: unknown; // or a more specific type if you know it
};



export const SolidImport = ({ listViewMetaData }: any) => {
  const toast = useRef<Toast>(null);
  const entityApi = createSolidEntityApi("userViewMetadata");
  const { useUpsertSolidEntityMutation } = entityApi;

  const [upsertUserView] = useUpsertSolidEntityMutation();

  if (!listViewMetaData?.data) return null;

  const solidView = listViewMetaData.data.solidView;
  console.log("listViewMetaData is", listViewMetaData);
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

  const [createExportTemplate] = useCreateExportTemplateMutation();
  const { data: templatesData } = useGetExportTemplatesQuery({});
  const formik = useFormik({
    initialValues: {
      selectedColumns: allColumns.filter((col) => checkedFieldNames.has(col.key)),
    },
    onSubmit: (values) => {
     // console.log("Selected columns:", values.selectedColumns);
    }
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

  const [selectedTemplate, setSelectedTemplate] = useState<TemplateOption | null>(null);
  const [selectedFormat, setSelectedFormat] = useState<FormatOption | null>(null);
  const [templateOptions, setTemplateOptions] = useState<TemplateOption[]>([]);
  const [addedTemplates, setAddedTemplates] = useState<TemplateOption[]>([]);
  const [requiredFields, setRequiredFields] = useState<string[]>([])
  const [groupedFields, setGroupedFields] = useState<FieldGroups>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [jsonData, setJsonData] = useState<FileData[]>([]);
  const [uniqueHeaders, setUniqueHeaders] = useState<string[]>([]);

  //  file drag login
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const file = files[0];
      handleFile(file); // <-- this should be the same function as used by browse
      e.dataTransfer.clearData(); // optional: clear drag data
    }
  };

  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFile(file);
    }
  };
  const handleFileUpload = async (e:any) => {
    const files = e.target.files || e.dataTransfer.files;
    const results = [];
    const headerSet: Set<string> = new Set();
    console.log("files are", files)
    for (const file of files) {
      const { headers, rows }= await readExcelFile(file);
      headers.forEach(header => headerSet.add(header)); // Store unique headers
      results.push({ fileName: file.name, data: rows });
      // results.push({ fileName: file.name, data });
    }
    console.log("results json data in before set is", results)
    setJsonData(results);
    setUniqueHeaders(Array.from(headerSet));
    // console.log("jsondata is", jsonData)
    // callApi(results); // Call API here
  };
  useEffect(() => {
    console.log("jsonData AFTER set:", jsonData);
    console.log("headers are", uniqueHeaders);
  }, [jsonData]);
  const readExcelFile = (file: File): Promise<{ headers: string[]; rows: any[] }> =>  {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (e: ProgressEvent<FileReader>) => {
        const result = e.target?.result;
        console.log("result is", result)
        if (!result || typeof result === 'string') {
          reject(new Error('Invalid file data'));
          return;
        }

        const data = new Uint8Array(result);
        const workbook = XLSX.read(data, { type: 'array' });
        console.log("Workbook read:", workbook);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        console.log("Raw sheet data:", sheet);
        const rows = XLSX.utils.sheet_to_json(sheet);
        // Extract headers from the first row
        const headers = rows.length > 0 ? Object.keys(rows[0] as object) : [];

      console.log("Parsed JSON data:", rows);
        resolve({ headers, rows });
      };

      reader.onerror = (err) => reject(err);
      reader.readAsArrayBuffer(file);
    });
  };


  const handleFile = (file: File) => {
    console.log('File uploaded:', file);
    // ✅ You can send file to API here (e.g., via fetch or axios)
    // const formData = new FormData();
    // formData.append('file', file);
    // await fetch('/api/upload', { method: 'POST', body: formData });
  };
  // end


  // creating field based on type
  useEffect(() => {
    const fields = listViewMetaData?.data?.solidFieldsMetadata;
  
    if (fields && typeof fields === "object") {
      const requiredFieldNames: string[] = [];
      const fieldGroups: FieldGroups = {};
  
      Object.values(fields).forEach((field: any) => {
        const fieldName = field.displayName || field.name;
        const type = field.type || "unknown";
  
        // Group by type
        if (!fieldGroups[type]) {
          fieldGroups[type] = [];
        }
        fieldGroups[type].push(fieldName);
  
        // Collect required fields
        if (field.required === true) {
          requiredFieldNames.push(fieldName);
        }
      });
      setRequiredFields(requiredFieldNames);
      setGroupedFields(fieldGroups);
    }
  }, []);

  // 

  //loading hardcode format
  const [formatOptions, setFormatOptions] = useState<FormatOption[]>([
    {
      name: "CSV",
      code: "csv",
      icon: (
        <svg fill="#000000" width="16" height="16" viewBox="0 0 318.188 318.188" xmlns="http://www.w3.org/2000/svg" 
        xmlnsXlink="http://www.w3.org/1999/xlink">
          <g>
            <g>
              <g>
                <rect x="182.882" y="155.008" width="33.713" height="15"/>
                <rect x="101.592" y="132.689" width="33.713" height="15"/>
                <rect x="182.882" y="132.689" width="33.713" height="15"/>
                <rect x="182.882" y="88.053" width="33.713" height="15"/>
                <rect x="182.882" y="110.371" width="33.713" height="15"/>
                <rect x="101.592" y="155.008" width="33.713" height="15"/>
                <polygon points="112.09,123.663 112.09,123.662 118.286,113.621 124.548,123.662 134.588,123.662 123.647,107.909 133.82,91.54 123.911,91.54 118.33,101.472 112.53,91.54 102.906,91.54 112.925,107.228 102.269,123.663"/>
                <path d="M201.02,249.514c-0.339,1.27-0.73,3.015-1.174,5.236c-0.445,2.222-0.741,4.073-0.889,5.555 c-0.127-2.053-0.847-5.691-2.158-10.918l-6.316-23.519h-14.092l15.139,46.401h14.759l15.202-46.401h-14.027L201.02,249.514z"/>
                <rect x="142.457" y="110.371" width="33.713" height="15"/>
                <rect x="142.457" y="88.053" width="33.713" height="15"/>
                <path d="M283.149,52.723L232.624,2.197C231.218,0.79,229.311,0,227.321,0H40.342c-4.142,0-7.5,3.358-7.5,7.5v303.188 c0,4.142,3.358,7.5,7.5,7.5h237.504c4.142,0,7.5-3.358,7.5-7.5V58.025C285.346,56.036,284.556,54.129,283.149,52.723z M234.821,25.606l24.918,24.919h-24.918V25.606z M47.842,15h171.979v10.263H47.842V15z M47.842,303.188V40.263h171.979v17.763 c0,4.143,3.358,7.5,7.5,7.5h43.024v237.662H47.842z"/>
                <rect x="142.457" y="132.689" width="33.713" height="15"/>
                <path d="M122.372,235.484c1.969,0,3.809,0.275,5.523,0.826c1.713,0.55,3.428,1.227,5.141,2.031l3.841-9.871 c-4.57-2.18-9.362-3.27-14.378-3.27c-4.591,0-8.585,0.98-11.98,2.937c-3.396,1.957-5.999,4.755-7.808,8.395 c-1.81,3.64-2.714,7.86-2.714,12.663c0,7.682,1.867,13.553,5.602,17.615c3.734,4.063,9.104,6.094,16.107,6.094 c4.888,0,9.268-0.857,13.14-2.57v-10.602c-1.947,0.805-3.883,1.492-5.808,2.063c-1.926,0.571-3.915,0.857-5.967,0.857 c-6.793,0-10.188-4.464-10.188-13.393c0-4.295,0.836-7.665,2.507-10.109C117.062,236.707,119.39,235.484,122.372,235.484z"/>
                <path d="M163.57,244.594c-4.169-1.904-6.724-3.216-7.665-3.936c-0.942-0.719-1.412-1.533-1.412-2.443 c-0.002-0.847,0.368-1.556,1.11-2.127c0.74-0.571,1.925-0.857,3.555-0.857c3.152,0,6.897,0.995,11.234,2.984l3.841-9.681 c-4.994-2.222-9.892-3.333-14.694-3.333c-5.439,0-9.713,1.196-12.822,3.587c-3.111,2.392-4.666,5.724-4.666,9.997 c0,2.285,0.365,4.264,1.095,5.936s1.851,3.152,3.364,4.443s3.782,2.624,6.809,3.999c3.343,1.503,5.4,2.497,6.173,2.983 c0.771,0.486,1.333,0.968,1.682,1.444c0.35,0.476,0.524,1.031,0.524,1.666c0,1.016-0.435,1.847-1.302,2.491 c-0.868,0.647-2.233,0.969-4.095,0.969c-2.158,0-4.527-0.344-7.109-1.032c-2.581-0.687-5.067-1.645-7.458-2.872v11.172 c2.264,1.079,4.443,1.836,6.538,2.27c2.095,0.434,4.687,0.65,7.775,0.65c3.703,0,6.93-0.619,9.681-1.856 c2.75-1.238,4.856-2.973,6.315-5.205c1.461-2.232,2.191-4.787,2.191-7.665c0-3.131-0.777-5.729-2.333-7.792 C170.346,248.323,167.569,246.393,163.57,244.594z"/>
                <rect x="142.457" y="155.008" width="33.713" height="15"/>
              </g>
            </g>
          </g>
        </svg>
      ),
    },
    {
      name: "Excel",
      code: "excel",
      icon: (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path fill-rule="evenodd" clip-rule="evenodd" d="M9.29289 1.29289C9.48043 1.10536 9.73478 1 10 1H18C19.6569 1 21 2.34315 21 4V9C21 9.55228 20.5523 10 20 10C19.4477 10 19 9.55228 19 9V4C19 3.44772 18.5523 3 18 3H11V8C11 8.55228 10.5523 9 10 9H5V20C5 20.5523 5.44772 21 6 21H7C7.55228 21 8 21.4477 8 22C8 22.5523 7.55228 23 7 23H6C4.34315 23 3 21.6569 3 20V8C3 7.73478 3.10536 7.48043 3.29289 7.29289L9.29289 1.29289ZM6.41421 7H9V4.41421L6.41421 7ZM19 12C19.5523 12 20 12.4477 20 13V19H23C23.5523 19 24 19.4477 24 20C24 20.5523 23.5523 21 23 21H19C18.4477 21 18 20.5523 18 20V13C18 12.4477 18.4477 12 19 12ZM11.8137 12.4188C11.4927 11.9693 10.8682 11.8653 10.4188 12.1863C9.96935 12.5073 9.86526 13.1318 10.1863 13.5812L12.2711 16.5L10.1863 19.4188C9.86526 19.8682 9.96935 20.4927 10.4188 20.8137C10.8682 21.1347 11.4927 21.0307 11.8137 20.5812L13.5 18.2205L15.1863 20.5812C15.5073 21.0307 16.1318 21.1347 16.5812 20.8137C17.0307 20.4927 17.1347 19.8682 16.8137 19.4188L14.7289 16.5L16.8137 13.5812C17.1347 13.1318 17.0307 12.5073 16.5812 12.1863C16.1318 11.8653 15.5073 11.9693 15.1863 12.4188L13.5 14.7795L11.8137 12.4188Z" fill="#000000"/>
        </svg>
      ),
    },
  ]);
  
  const [isDialogVisible, setIsDialogVisible] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const steps = [
    { label: 'Instructions', value: 'instructions' },
    { label: 'Import', value: 'import' },
    { label: 'Summary', value: 'summary' },
  ];
  const [currentStepValue, setCurrentStepValue] = useState('instructions');

  useEffect(() => {
    if (templatesData?.records && templatesData.records.length > 0) {
      const templates = templatesData.records.map((template: any) => ({
        name: template.templateName,
        code: template.id,
        fields:template.fields,
        templateFormat:template.templateFormat
      }));
      setTemplateOptions([...templates, ...addedTemplates]);
    }
  }, [templatesData, addedTemplates]);
  
    const handleAddTemplate = async() => {
      const tname = newTemplateName.trim();
      if (tname) {
        setNewTemplateName(""); 
        setIsDialogVisible(false); 
        let customSelectedFields = selectedColumns.map((col) => col.key);
        const fieldsData = JSON.stringify(customSelectedFields)
        const exportData = {
          templateName: tname,
          templateFormat: selectedFormat?.code || "",
          notifyOnEmail: true,  
          fields:fieldsData,
          modelMetadataId: solidView?.model?.id,
        };
        try {
          const response = await createExportTemplate(exportData).unwrap();
          toast?.current?.show({
            severity: "success",
            summary: "Template Added",
            detail: "Template Saved",
          });
          let newAddedTemplate: TemplateOption = {
            name: tname,
            code: response.data.id,
            fields: customSelectedFields,
            templateFormat: selectedFormat?.code || "",
          };
          setAddedTemplates((prev) => [...prev, newAddedTemplate]);
          setSelectedTemplate(newAddedTemplate);
          setSelectedFormat(formatOptions.find((format) => format.code === selectedFormat?.code) || null);
        } catch (err) {
          console.error('Failed to create template:', err);
        }
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

  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const [message,setMessage] = useState("");
  const [messageDescription,setMessageDescription] = useState("");
  const [status,setStatus] = useState("In Progress");
  const downloadHandlers = {
    onProgress: (value: number) => {
      setProgress(value);
    },
    onStatusChange: (statusType: "In Progress" | "success" | "error", msg: string, submsg: string) => {
      setStatus(statusType);
      setMessage(msg);
      setMessageDescription(submsg);
      setShowProgress(true);
    },
  };
  const handleDownload = async () => {
    const id  = selectedTemplate?.code
    try {
      await downloadFileWithProgress(`/export-template/${id}/startExport/sync`, downloadHandlers);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleTemplateChange = (e: any) => {
    const selected = templateOptions.find((option) => option.code === e.value.code);  
    setSelectedTemplate(selected || null);
    if (selected) {
      let fields: string[] = [];
      if (typeof selected.fields === "string") {
        try {
          fields = JSON.parse(selected.fields);
        } catch (error) {
          console.error("Failed to parse fields:", error);
        }
      } else if (Array.isArray(selected.fields)) {
        fields = selected.fields;
      }
  
      const selectedFields = fields.map((field) => ({
        key: field,
        name: solidFieldsMetadata[field]?.displayName || field,
      }));
  
      formik.setFieldValue("selectedColumns", selectedFields);
      setSelectedTemplate(selected);
      const format = formatOptions.find(f => f.code === selected.templateFormat);
      setSelectedFormat(format || null);
    } else {
      setSelectedTemplate(null);
    }
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

  const renderFileHeader = (item: any) => (
    <div key={item.key} className="solid-picklist-item-wrapper solid-picklist-source-item">
        <div className="flex items-center gap-2">
            <label htmlFor={item} className="ml-2 solid-import-filename-header-name">
                {item}
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
  const maxVisibleRows = Math.max(availableColumns.length, selectedColumns.length);
  const renderEmptyRow = (index: number) => (
    <div key={`empty-${index}`} className="solid-picklist-item-wrapper" />
  );
    // Dialog footer (Save and Cancel buttons)
    const dialogFooter = (
      <div>
         <Button
          label="Save"
          className="p-button rounded"
          onClick={()=>handleAddTemplate()}
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
  return (
    <>
      <Toast ref={toast} />
      <div className="flex align-items-center justify-content-between m-0 p-0">
      <SolidExportStepper
       solidFormViewWorkflowData={steps}
       activeValue={currentStepValue}
       setActiveValue={setCurrentStepValue} />
      </div>

      <div className="p-3">
          {/*if click on export button then export view visible and if clicked on summary then summary view custom tab  */}
          {/* adding for Instructions */}
          { currentStepValue === 'instructions' && 
            <>
            <div className="solid-instructions mt-2">
              <div className="solid-custom-instruction">
                  <p className="instruction-required-field-header">Standard Instructions :</p>
                <div className="instruction-button-main">
                  <p className="instruction-required-field-data"> 1. CSV or Excel (based on radio button selected) template:</p>
                  <div className="instruction-button gap-4">
                    <Button 
                      className="p-button" 
                      label="CSV Download"
                      />
                      <Button 
                      className="p-button" 
                      label="Excel Download"
                      />
                  </div>
                </div>
                <div className="instruction-field">
                  <p className="instruction-required-field-header">2. Required / mandatory fields :</p>
                  <p className="instruction-required-field-data">{requiredFields.join(", ")}</p>
                  {Object.entries(groupedFields).map(([type, fields]) => (
                    <div key={type}>
                      <p className="instruction-required-field-header">{type.charAt(0).toUpperCase() + type.slice(1)} Fields</p>
                      <p className="instruction-required-field-data">
                        {fields.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="custom-instructions-text mt-4">
                  <p className="instruction-required-field-header">Custom Instructions: </p>
                  <p className="instruction-required-field-data">1. Custom filters instruction 1</p>
                </div> 
                       
              </div>
            </div>
            <div>
              <Button 
                className="p-button mt-3 mr-2" 
                label="Continue"
                onClick={()=>setCurrentStepValue('import')}
              />
            </div>
            </>
          }
          { currentStepValue === 'import' && jsonData?.length === 0 &&
                <>
                <div className="solid-export-controls gap-2">
                
                  <Button 
                  className="p-button" 
                  label="Uploads Files"
                  onClick={handleFileUpload}
                  />
                  <Button 
                  className="p-button" 
                  label="Import"
                  disabled={jsonData?.length === 0}
                  />
                  
                </div>
              
                <div className="solid-custom-picklist mt-2">
                            <div
                            className={`import-upload-file ${isDragging ? 'dragging' : ''}`}
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                      >
                              <div>
                                <svg width="250" height="200" viewBox="0 0 250 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                                  <path fill-rule="evenodd" clip-rule="evenodd" d="M207 65C210.866 65 214 68.134 214 72C214 75.866 210.866 79 207 79H167C170.866 79 174 82.134 174 86C174 89.866 170.866 93 167 93H189C192.866 93 196 96.134 196 100C196 103.866 192.866 107 189 107H178.826C173.952 107 170 110.134 170 114C170 116.577 172 118.911 176 121C179.866 121 183 124.134 183 128C183 131.866 179.866 135 176 135H93C89.134 135 86 131.866 86 128C86 124.134 89.134 121 93 121H54C50.134 121 47 117.866 47 114C47 110.134 50.134 107 54 107H94C97.866 107 101 103.866 101 100C101 96.134 97.866 93 94 93H69C65.134 93 62 89.866 62 86C62 82.134 65.134 79 69 79H109C105.134 79 102 75.866 102 72C102 68.134 105.134 65 109 65H207ZM207 93C210.866 93 214 96.134 214 100C214 103.866 210.866 107 207 107C203.134 107 200 103.866 200 100C200 96.134 203.134 93 207 93Z" fill="#F9F0FF"/>
                                  <path fill-rule="evenodd" clip-rule="evenodd" d="M153.672 63.9997L162.974 131.842L163.809 138.649C164.079 140.841 162.519 142.837 160.327 143.106L101.766 150.297C99.5738 150.566 97.578 149.007 97.3088 146.814L88.2931 73.3865C88.1584 72.2901 88.9381 71.2922 90.0344 71.1576C90.0413 71.1568 90.0483 71.156 90.0552 71.1552L94.9136 70.6102M98.8421 70.1695L103.429 69.655L98.8421 70.1695Z" fill="white"/>
                                  <path d="M154.91 63.8299C154.816 63.1459 154.186 62.6675 153.502 62.7613C152.818 62.8551 152.34 63.4855 152.433 64.1695L154.91 63.8299ZM162.974 131.842L164.214 131.69C164.214 131.684 164.213 131.678 164.212 131.673L162.974 131.842ZM163.809 138.649L165.05 138.496L163.809 138.649ZM160.327 143.106L160.479 144.347L160.327 143.106ZM101.766 150.297L101.919 151.537L101.766 150.297ZM97.3088 146.814L98.5495 146.662L97.3088 146.814ZM90.0552 71.1552L90.1945 72.3974L90.0552 71.1552ZM95.0529 71.8524C95.739 71.7755 96.2327 71.1569 96.1558 70.4709C96.0788 69.7848 95.4603 69.291 94.7742 69.368L95.0529 71.8524ZM98.7028 68.9273C98.0167 69.0043 97.5229 69.6228 97.5999 70.3089C97.6768 70.9949 98.2954 71.4887 98.9814 71.4117L98.7028 68.9273ZM103.568 70.8972C104.255 70.8202 104.748 70.2017 104.671 69.5156C104.594 68.8296 103.976 68.3358 103.29 68.4128L103.568 70.8972ZM152.433 64.1695L161.735 132.012L164.212 131.673L154.91 63.8299L152.433 64.1695ZM161.733 131.995L162.569 138.801L165.05 138.496L164.214 131.69L161.733 131.995ZM162.569 138.801C162.754 140.309 161.682 141.681 160.174 141.866L160.479 144.347C163.357 143.994 165.403 141.374 165.05 138.496L162.569 138.801ZM160.174 141.866L101.614 149.056L101.919 151.537L160.479 144.347L160.174 141.866ZM101.614 149.056C100.107 149.241 98.7346 148.169 98.5495 146.662L96.0681 146.966C96.4215 149.844 99.0409 151.891 101.919 151.537L101.614 149.056ZM98.5495 146.662L89.5337 73.2341L87.0524 73.5388L96.0681 146.966L98.5495 146.662ZM89.5337 73.2341C89.4833 72.823 89.7756 72.4488 90.1867 72.3983L89.8821 69.9169C88.1005 70.1357 86.8336 71.7572 87.0524 73.5388L89.5337 73.2341ZM90.1867 72.3983C90.1893 72.398 90.1919 72.3977 90.1945 72.3974L89.9159 69.913C89.9046 69.9142 89.8933 69.9156 89.8821 69.9169L90.1867 72.3983ZM90.1945 72.3974L95.0529 71.8524L94.7742 69.368L89.9159 69.913L90.1945 72.3974ZM98.9814 71.4117L103.568 70.8972L103.29 68.4128L98.7028 68.9273L98.9814 71.4117Z" fill="#722ED1"/>
                                  <path fill-rule="evenodd" clip-rule="evenodd" d="M151.14 68.2696L159.56 129.753L160.317 135.922C160.561 137.909 159.167 139.715 157.203 139.956L104.761 146.395C102.798 146.636 101.008 145.221 100.764 143.234L92.6141 76.8572C92.4795 75.7608 93.2591 74.7629 94.3555 74.6283L100.843 73.8318" fill="#F9F0FF"/>
                                  <path d="M110.672 51.25H156.229C156.866 51.25 157.481 51.4715 157.971 51.8721L158.173 52.0547L171.616 65.4902C172.132 66.0059 172.422 66.7053 172.422 67.4346V130C172.422 131.519 171.191 132.75 169.672 132.75H110.672C109.153 132.75 107.922 131.519 107.922 130V54C107.922 52.4812 109.153 51.25 110.672 51.25Z" fill="white" stroke="#722ED1" stroke-width="2.5"/>
                                  <path d="M156.672 52.4023V63.9995C156.672 65.6564 158.015 66.9995 159.672 66.9995H167.605" stroke="#722ED1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                  <path d="M118 118H144M118 67H144H118ZM118 79H161H118ZM118 92H161H118ZM118 105H161H118Z" stroke="#9254DE" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                                  </svg>
                              </div>
                              <input
                                  type="file"
                                  ref={fileInputRef}
                                  multiple
                                  onChange={handleFileUpload}
                                  style={{ display: 'none' }}
                                  accept=".xlsx,.xls,.csv"
                                />
                              <div>
                              Drop or upload a file to import
                              </div>
                              <div>
                                  Excel files are recommended as formatting is automatic.
                                  But, you can also use .csv files
                              </div>
                              <div className="solid-import-button-section">
                              <Button 
                                  className="p-button" 
                                  label="Download Sample File"
                                  />
                                  <Button 
                                  className="p-button browse-file" 
                                  label="Click to Browse"
                                  onClick={handleBrowseClick} 
                                  />
                              </div>
                            </div>
                </div>
                </>
          }

          { currentStepValue === 'import' && jsonData?.length > 0 &&
                      <>
                      <div className="solid-export-controls gap-2">
                
                        <Button 
                        className="p-button" 
                        label="Uploads Files"
                        onClick={handleFileUpload}
                        />
                        <Button 
                        className="p-button" 
                        label="Import"
                        disabled={jsonData?.length === 0}
                        />
                        <Button 
                        className="p-button" 
                        label="Cancel"
                        onClick={handleFileUpload}
                        />
                        
                      </div>
                      <div className="solid-custom-picklist mt-2">
                        <div className="flex">
                            {/* All Questions */}
                            <div className="w-4">
                                <div className="solid-picklist-header solid-source-picklist-header">File Column</div>
                                <div>
                                    {uniqueHeaders.map(renderFileHeader)}
                                    
                                </div>
                            </div>

                            {/* Selected Questions */}
                            <div className="w-4">
                                <div className="solid-picklist-header">Odoo Fields</div>
                                <div>
                                  {uniqueHeaders.map(renderFileHeader)}
                                </div>
                            </div>
                            <div className="w-4">
                                <div className="soilid-import-filename">
                                  <span className="solid-import-file-text">Data to Import</span>
                                  {jsonData.map((file, index) => (
                                    <div key={index} className="flex items-center text-gray-700 gap-3 mt-4">
                                      <svg
                                        width="16"
                                        height="16"
                                        viewBox="0 0 16 16"
                                        fill="none"
                                        xmlns="http://www.w3.org/2000/svg"
                                      >
                                        <path
                                          d="M5.33329 11.9997H10.6666V10.6663H5.33329V11.9997ZM5.33329 9.33301H10.6666V7.99967H5.33329V9.33301ZM3.99996 14.6663C3.63329 14.6663 3.3194 14.5358 3.05829 14.2747C2.79718 14.0136 2.66663 13.6997 2.66663 13.333V2.66634C2.66663 2.29967 2.79718 1.98579 3.05829 1.72467C3.3194 1.46356 3.63329 1.33301 3.99996 1.33301H9.33329L13.3333 5.33301V13.333C13.3333 13.6997 13.2027 14.0136 12.9416 14.2747C12.6805 14.5358 12.3666 14.6663 12 14.6663H3.99996ZM8.66663 5.99967V2.66634H3.99996V13.333H12V5.99967H8.66663Z"
                                          fill="#4B4D52"
                                        />
                                      </svg>
                                      <span className="solid-import-file-filename-text">{file.fileName}</span>
                                    </div>
                                  ))}
                                </div>
                            </div>
                        </div>
                      </div>
                      </>
                    }

          {currentStepValue === 'summary' && (
                <p className="m-0">
                Relations and Media Fields are not supported for Export.
                </p>
          )}
        </div>
        <DownloadProgressToast
        visible={showProgress}
        progress={progress}
        message={message}
        submessage={messageDescription}
        status={status}
        onClose={() => setShowProgress(false)}
        />
    </>
  );
};