const SolidTableRowCell = ({ value, truncateAfter }: { value: string; truncateAfter?: number }) => {
    return (
        <div
            className="solid-table-row"
            style={{ maxWidth: truncateAfter ? `${truncateAfter}ch` : '30ch' }}
        >
            {value}
        </div>
    );
};

export default SolidTableRowCell;