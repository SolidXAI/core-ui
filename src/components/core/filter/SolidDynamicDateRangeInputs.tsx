import { SolidInput } from "../../shad-cn-ui/SolidInput";

const DYNAMIC_DATE_OPERATORS = ['$thisWeek', '$thisMonth'];

export const isDynamicDateOperator = (matchMode: string): boolean =>
    DYNAMIC_DATE_OPERATORS.includes(matchMode);

const getUtcDynamicDateRange = (
    matchMode: string,
    fieldType: 'date' | 'datetime',
): [string, string] => {
    const now = new Date();
    let start: Date;
    let end: Date;

    if (matchMode === '$thisWeek') {
        start = new Date(Date.UTC(
            now.getUTCFullYear(),
            now.getUTCMonth(),
            now.getUTCDate(),
        ));

        const daysSinceMonday = (start.getUTCDay() + 6) % 7;
        start.setUTCDate(start.getUTCDate() - daysSinceMonday);

        end = new Date(start);
        end.setUTCDate(end.getUTCDate() + 7);
        end.setUTCMilliseconds(-1);
    } else {
        start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
        end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1));
        end.setUTCMilliseconds(-1);
    }

    if (fieldType === 'date') {
        return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
    }

    // Match the value format used by the normal datetime-local filter input.
    // The backend still resolves and queries the full UTC range including milliseconds.
    return [start.toISOString().slice(0, 16), end.toISOString().slice(0, 16)];
};

type SolidDynamicDateRangeInputsProps = {
    matchMode: '$thisWeek' | '$thisMonth';
    fieldType: 'date' | 'datetime';
};

export const SolidDynamicDateRangeInputs = ({
    matchMode,
    fieldType,
}: SolidDynamicDateRangeInputsProps) => {
    const [start, end] = getUtcDynamicDateRange(matchMode, fieldType);

    return (
        <div className="solid-filter-var-input-between">
            <SolidInput
                type={fieldType === 'date' ? 'date' : 'datetime-local'}
                value={start}
                readOnly
                aria-label="Filter start date"
                title="Start date"
                className="w-full solid-filter-compact-control"
            />
            <SolidInput
                type={fieldType === 'date' ? 'date' : 'datetime-local'}
                value={end}
                readOnly
                aria-label="Filter end date"
                title="End date"
                className="w-full solid-filter-compact-control"
            />
        </div>
    );
};

