import { DateFieldViewComponent } from "../../common/DateFieldViewComponent";
import { SolidListFieldWidgetProps } from "../../../../types/solid-core";
import "./published-status-list-view-widget.css";

export const PublishedStatusListViewWidget = ({ rowData, column }: SolidListFieldWidgetProps) => {
    const colVal = rowData[column.attrs.name];
    const isPublished = column.attrs.name === 'isPublished' ? Boolean(colVal) : Boolean(rowData?.isPublished ?? colVal);
    const publishedAt = rowData?.publishedAt || (column.attrs.name === 'publishedAt' ? colVal : null);

    return (
        <div className={"published-status-published-status-cell"}>
            <span className={`${"published-status-published-status-pill"} ${isPublished ? "published-status-published" : "published-status-unpublished"}`}>
                {isPublished ? 'Published' : 'Unpublished'}
            </span>
            {isPublished && publishedAt && (
                <span className={"published-status-published-status-time"}>
                    <DateFieldViewComponent value={publishedAt} showTime fallback="" />
                </span>
            )}
        </div>
    );
};
