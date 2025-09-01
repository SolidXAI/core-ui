const SolidTableRowCell = ({ value, truncateAfter }: { value: string; truncateAfter?: number }) => {
    // Utility function to detect if value contains HTML
    const isHTML = (str: string) => /<\/?[a-z][\s\S]*>/i.test(str);

    // Utility function to strip HTML tags
    const stripHTML = (str: string) => str.replace(/<[^>]+>/g, '');
    
    const displayValue = isHTML(value) ? stripHTML(value) : value;

    return (
        <div
            className="solid-table-row"
            style={{ maxWidth: truncateAfter ? `${truncateAfter}ch` : '30ch' }}
        >
            {displayValue}
        </div>
    );
};

export default SolidTableRowCell;