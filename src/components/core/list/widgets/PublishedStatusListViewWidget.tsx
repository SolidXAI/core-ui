import { DateFieldViewComponent } from "../../common/DateFieldViewComponent";
import { SolidListFieldWidgetProps } from "../../../../types/solid-core";
import styles from "./PublishedStatusListViewWidget.module.css";

export const PublishedStatusListViewWidget = ({ rowData, column }: SolidListFieldWidgetProps) => {
    const colVal = rowData[column.attrs.name];
    const isPublished = column.attrs.name === 'isPublished' ? Boolean(colVal) : Boolean(rowData?.isPublished ?? colVal);
    const publishedAt = rowData?.publishedAt || (column.attrs.name === 'publishedAt' ? colVal : null);

    return (
        <div className={styles.publishedStatusCell}>
            <span className={`${styles.publishedStatusPill} ${isPublished ? styles.published : styles.unpublished}`}>
                {isPublished ? 'Published' : 'Unpublished'}
            </span>
            {isPublished && publishedAt && (
                <span className={styles.publishedStatusTime}>
                    <DateFieldViewComponent value={publishedAt} showTime fallback="" />
                </span>
            )}
        </div>
    );
};
