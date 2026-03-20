
import React from 'react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import { RightArrowSvg } from '../../../components/Svg/RightArrowSvg'

dayjs.extend(utc)

const DATE_FIELD_TYPES = ['date', 'datetime', 'time']

function formatAuditValue(
    value: string | null | undefined,
    displayValue: string | null | undefined,
    fieldType?: string
): string {
    if (fieldType && DATE_FIELD_TYPES.includes(fieldType)) {
        if (!value) return 'None'

        // UTC ISO string (has Z) — convert to browser local time
        if (value.endsWith('Z')) {
            const d = dayjs(value)
            if (!d.isValid()) return value
            if (fieldType === 'date') return d.format('DD-MM-YYYY')
            if (fieldType === 'time') return d.format('HH:mm')
            return d.format('DD-MM-YYYY HH:mm')
        }

        // Wall-clock string (no Z) — parse as UTC to preserve components without timezone shift
        const d = dayjs.utc(value)
        if (!d.isValid()) return value
        if (fieldType === 'date') return d.format('DD-MM-YYYY')
        if (fieldType === 'time') return d.format('HH:mm')
        return d.format('DD-MM-YYYY HH:mm')
    }

    return displayValue || value || 'None'
}

interface AuditRecord {
    field: string;
    fieldDisplayName: string;
    fieldType?: string;
    previous: string | null;
    current: string | null;
    previousDisplay?: string | null;
    currentDisplay?: string | null;
}

interface SolidChatterAuditMessageProps {
    auditRecord: AuditRecord[];
}

export const SolidChatterAuditMessage: React.FC<SolidChatterAuditMessageProps> = ({ auditRecord }) => {
    return (
        <div className='flex flex-column gap-2'>
            {auditRecord.map((item: AuditRecord, index: number) => (
                <div key={index} className='flex gap-2'>
                    <span className='m-0 text-sm'>
                        {"(" + (item.fieldDisplayName || item.field) + ")"}
                    </span>
                    <span className='m-0 text-sm font-bold'>
                        {formatAuditValue(item.previous, item.previousDisplay, item.fieldType)}
                    </span>
                    <RightArrowSvg />
                    <span className='m-0 text-sm font-bold text-primary'>
                        {formatAuditValue(item.current, item.currentDisplay, item.fieldType)}
                    </span>
                </div>
            ))}
        </div>
    );
};
