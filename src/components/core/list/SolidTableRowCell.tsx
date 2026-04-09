import { Info } from "lucide-react";
import { SolidTooltip, SolidTooltipContent, SolidTooltipTrigger } from "../../shad-cn-ui";

const SolidTableRowCell = ({ value, truncateAfter }: { value: string; truncateAfter?: number }) => {
    const safeValue = value !== null && value !== undefined ? String(value) : "";
    // Utility function to detect if value contains HTML
    const isHTML = (str: string) => /<\/?[a-z][\s\S]*>/i.test(str);

    // Utility function to strip HTML tags
    const stripHTML = (str: string) => str.replace(/<[^>]+>/g, '');

    const displayValue = isHTML(safeValue) ? stripHTML(safeValue) : safeValue;

    return (
        <div className="flex align-items-center">
            <div
                className="solid-table-row"
                style={truncateAfter ? { maxWidth: `${truncateAfter}ch` } : {}}
            // title={truncateAfter ? displayValue : undefined}
            >
                {displayValue}
            </div>
            {truncateAfter && displayValue.length > truncateAfter &&
                <SolidTooltip>
                    <SolidTooltipTrigger asChild>
                        <button type="button" className="solid-field-tooltip-icon" aria-label="Show full value">
                            <Info size={14} />
                        </button>
                    </SolidTooltipTrigger>
                    <SolidTooltipContent>{displayValue}</SolidTooltipContent>
                </SolidTooltip>
            }
        </div>
    );

};

export default SolidTableRowCell;
