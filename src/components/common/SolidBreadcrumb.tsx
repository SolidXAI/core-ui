import Link from 'next/link';
import { BreadCrumb } from 'primereact/breadcrumb';
import React from 'react';

interface BreadcrumbItem {
    label: string;
    link?: string;
}

interface SolidBreadcrumbProps {
    breadcrumbItems: BreadcrumbItem[];
}

export const SolidBreadcrumb: React.FC<SolidBreadcrumbProps> = ({ breadcrumbItems }) => {
    const items = breadcrumbItems.map((item) => ({
        label: item.label,
        ...(item.link && item.link !== '#' ? {
            template: () => (
                <Link href={item.link || '/'}>
                    <p className="text-primary font-normal">{item.label}</p>
                </Link>
            )
        } : {})
    }));

    return <BreadCrumb model={items} className="solid-breadcrumb" />;
};