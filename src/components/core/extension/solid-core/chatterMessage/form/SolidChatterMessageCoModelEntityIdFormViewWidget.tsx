import { useEffect, useState } from "react";
import { SolidFormFieldWidgetProps } from "../../../../../../types/solid-core";
import { ExternalLink } from "lucide-react";
import { solidGet } from "../../../../../../http/solidHttp";
import { snakeCase } from "lodash";

export const SolidChatterMessageCoModelEntityIdFormViewWidget = ({ formik, fieldContext }: SolidFormFieldWidgetProps) => {
    const fieldMetadata = fieldContext.fieldMetadata;
    const fieldLayoutInfo = fieldContext.field;

    const fieldLabel = fieldLayoutInfo.attrs.label ?? fieldMetadata.displayName;
    const fieldName = fieldLayoutInfo?.attrs?.name;

    const [redirectUrl, setRedirectUrl] = useState<string>('#');
    const value = formik.values?.[fieldName];

    const coModelName = fieldContext?.data?.coModelName;
    const modelDisplayName = fieldContext?.data?.modelDisplayName;
    const modelUserKey = fieldContext?.data?.modelUserKey;

    useEffect(() => {
        if (coModelName) {
            const fetchModel = async () => {
                const qs = `offset=0&limit=25&filters[$and][0][$or][0][singularName][$eq]=${coModelName}&populate[0]=module&locale=en&sort[0]=id%3Adesc`;
                const res = await solidGet(`/model-metadata?${qs}`);
                if (res?.data?.data?.records?.length > 0) {
                    const model = res?.data?.data?.records[0];
                    const module = model?.module;
                    const moduleName = module?.name;
                    const modelSingularName = model?.singularName;
                    const modelSlug = snakeCase(model?.singularName).replace(/_/g, '-');
                    const redirectUrl = `/admin/core/${moduleName}/${modelSlug}/form/${value}`;
                    setRedirectUrl(redirectUrl);
                }
            }
            fetchModel();
        }
    }, [coModelName]);

    return (
        <div>
            <label className="form-field-label">{fieldLabel}</label>
            <div className="mt-2">
                {value ? (
                    <a
                        href={redirectUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '6px',
                            textDecoration: 'none',
                            fontSize: '12px',
                            color: '#722ED1',
                            fontWeight: 500
                        }}
                    >
                        <span>{value} ({modelUserKey || modelDisplayName || coModelName})</span>
                        <ExternalLink size={16} />
                    </a>
                ) : (
                    <span className="text-muted">—</span>
                )}
            </div>
        </div>
    );
};