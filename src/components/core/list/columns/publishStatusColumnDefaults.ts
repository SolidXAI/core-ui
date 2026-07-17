export const getDefaultPublishStatusListWidget = (solidListViewMetaData: any, fieldName: string) => {
    const isDraftPublishWorkflowEnabled = solidListViewMetaData?.data?.solidView?.model?.draftPublishWorkflow === true;
    if (!isDraftPublishWorkflowEnabled) {
        return null;
    }

    if (fieldName === 'isPublished') {
        return 'PublishedStatusListViewWidget';
    }

    if (fieldName !== 'publishedAt') {
        return null;
    }

    const listColumns = solidListViewMetaData?.data?.solidView?.layout?.children;
    const hasIsPublishedColumn = Array.isArray(listColumns)
        && listColumns.some((listColumn: any) => listColumn?.attrs?.name === 'isPublished');

    return hasIsPublishedColumn ? null : 'PublishedStatusListViewWidget';
};
