import SolidTableRowCell from "../SolidTableRowCell";

export const SolidShortTextFieldTextRenderModeWidget = ({ value, truncateAfter }: any) => {
    return (
        <SolidTableRowCell
            value={value}
            truncateAfter={truncateAfter}
        ></SolidTableRowCell>
    )
};

