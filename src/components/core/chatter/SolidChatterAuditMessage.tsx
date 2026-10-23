
import React from 'react'
import dayjs from 'dayjs'
import ReactDiffViewer, { DiffMethod } from 'react-diff-viewer-continued'
import { RightArrowSvg } from '../../../components/Svg/RightArrowSvg'
import { SolidDialog, SolidDialogBody, SolidDialogClose, SolidDialogHeader, SolidDialogTitle, SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from '../../../components/shad-cn-ui'
import './SolidChatterAuditMessage.css'

const DATE_FIELD_TYPES = ['date', 'datetime', 'time']

function isEmptyAuditValue(value: string | null | undefined): boolean {
    if (value == null) return true
    if (typeof value !== 'string') return false

    const normalizedValue = value.trim().toLowerCase()
    return normalizedValue === '' || normalizedValue === 'none' || normalizedValue === 'null'
}

function hasMeaningfulAuditChange(item: AuditRecord): boolean {
    const previousValue = item.previousDisplay ?? item.previous
    const currentValue = item.currentDisplay ?? item.current

    return !(isEmptyAuditValue(previousValue) && isEmptyAuditValue(currentValue))
}

function formatAuditValue(
    value: string | null | undefined,
    displayValue: string | null | undefined,
    fieldType?: string
): string {
    // fieldType may be null for older audit records — fall through to displayValue
    if (fieldType && DATE_FIELD_TYPES.includes(fieldType)) {
        if (!value) return 'None'
        const d = dayjs(value)
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
    const visibleAuditRecord = auditRecord.filter(hasMeaningfulAuditChange)

    if (visibleAuditRecord.length === 0) {
        return null
    }

    return (
        <div className='flex flex-col gap-2'>
            {visibleAuditRecord.map((item: AuditRecord, index: number) => (
                <AuditFieldChange key={index} item={item} />
            ))}
        </div>
    );
};

function AuditFieldChange({ item }: { item: AuditRecord }) {
    const [isDiffOpen, setIsDiffOpen] = React.useState(false)
    const previousValue = formatAuditValue(item.previous, item.previousDisplay, item.fieldType)
    const currentValue = formatAuditValue(item.current, item.currentDisplay, item.fieldType)
    const isLongText = item.fieldType?.toLowerCase() === 'longtext'

    return <div className='solid-audit-change flex gap-2'>
                    <span className='solid-audit-field-name m-0'>
                        {"(" + (item.fieldDisplayName || item.field) + ")"}
                    </span>
                    {isLongText ? <>
                        <div className='solid-audit-longtext-values'>
                            <LongTextValue value={previousValue} onClick={() => setIsDiffOpen(true)} />
                            <RightArrowSvg />
                            <LongTextValue value={currentValue} current onClick={() => setIsDiffOpen(true)} />
                        </div>
                        <SolidDialog open={isDiffOpen} onOpenChange={setIsDiffOpen} ariaLabel={`${item.fieldDisplayName || item.field} differences`} className='solid-audit-diff-dialog' showHeader={false}>
                            <SolidDialogHeader className='solid-audit-diff-dialog__header'>
                                <SolidDialogTitle>{item.fieldDisplayName || item.field}</SolidDialogTitle>
                                <SolidDialogClose aria-label='Close' />
                            </SolidDialogHeader>
                            <SolidDialogBody className='solid-audit-diff-dialog__body'>
                                <ReactDiffViewer oldValue={previousValue} newValue={currentValue} splitView compareMethod={DiffMethod.WORDS} showDiffOnly={false} />
                            </SolidDialogBody>
                        </SolidDialog>
                    </> : <>
                        <span className='m-0 font-bold'>{previousValue}</span>
                        <RightArrowSvg />
                        <span className='m-0 font-bold text-[var(--primary-color)]'>{currentValue}</span>
                    </>}
                </div>
}

function LongTextValue({ value, current = false, onClick }: { value: string; current?: boolean; onClick: () => void }) {
    const preview = value.length > 20 ? `${value.slice(0, 20)}...` : value
    return <SolidTooltip>
        <SolidTooltipTrigger asChild>
            <button type='button' className={`solid-audit-longtext-value font-bold${current ? ' is-current' : ''}`} onClick={onClick} aria-haspopup='dialog'>
                {preview}
            </button>
        </SolidTooltipTrigger>
        <SolidTooltipContent>View full text diff</SolidTooltipContent>
    </SolidTooltip>
}
