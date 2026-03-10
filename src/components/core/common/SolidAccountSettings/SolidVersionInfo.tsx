import { useEffect } from "react";
import { useLazyGetSolidVersionInfoQuery } from "../../../../redux/api/solidSettingsApi";
import { Tag } from "primereact/tag";
import { ProgressSpinner } from "primereact/progressspinner";
interface PackageVersionInfo {
    repo: 'local' | 'npm';
    version: string;
}

const PACKAGE_LABELS: Record<string, string> = {
    'solid-core': 'Solid Core',
    'solid-core-ui': 'Solid Core UI',
    'solid-code-builder': 'Solid Code Builder',
};

const PACKAGE_ICONS: Record<string, string> = {
    'solid-core': 'pi pi-server',
    'solid-core-ui': 'pi pi-desktop',
    'solid-code-builder': 'pi pi-code',
};

export const SolidVersionInfo = () => {
    const [trigger, { data, isLoading, isError }] = useLazyGetSolidVersionInfoQuery();

    useEffect(() => {
        trigger("");
    }, [trigger]);

    if (isLoading) {
        return (
            <div className="flex align-items-center justify-content-center" style={{ minHeight: '200px' }}>
                <ProgressSpinner style={{ width: '40px', height: '40px' }} />
            </div>
        );
    }

    if (isError || !data) {
        return (
            <div className="flex align-items-center justify-content-center p-4">
                <p className="text-500">Unable to load version information.</p>
            </div>
        );
    }

    const packages = ((data as any)?.data ?? data) as Record<string, PackageVersionInfo>;

    return (
        <div className="flex flex-column gap-3">
            <h5 className="m-0 font-bold">Version Information</h5>
            <p className="m-0 text-500" style={{ fontSize: '0.875rem' }}>
                Packages powering this application
            </p>
            <div className="flex flex-column gap-2 mt-2">
                {Object.entries(packages).map(([key, info]) => (
                    <div
                        key={key}
                        className="flex align-items-center justify-content-between p-3 border-round surface-ground"
                    >
                        <div className="flex align-items-center gap-3">
                            <i className={`${PACKAGE_ICONS[key] || 'pi pi-box'} text-primary`} style={{ fontSize: '1.25rem' }}></i>
                            <div className="flex flex-column">
                                <span className="font-semibold">{PACKAGE_LABELS[key] || key}</span>
                                <span className="text-500" style={{ fontSize: '0.75rem' }}>@solidxai/{key === 'solid-core' ? 'core' : key === 'solid-core-ui' ? 'core-ui' : 'code-builder'}</span>
                            </div>
                        </div>
                        <div className="flex align-items-center gap-2">
                            <Tag
                                value={info.version}
                                severity="info"
                                className="text-sm"
                            />
                            <Tag
                                value={info.repo}
                                severity={info.repo === 'local' ? 'warning' : 'success'}
                                className="text-sm"
                            />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
