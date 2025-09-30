import { Button } from 'primereact/button'

export const ColumnSelectorFooter = ({ customizeLayout }: any) => {
    return (
        <div className="p-3 flex gap-2">
            <Button type='submit' label="Apply" size="small" />
            <Button type='button' outlined label="Cancel" size="small"
                // @ts-ignore
                onClick={(e) => customizeLayout.current.hide(e)}
            />
        </div>
    )
}