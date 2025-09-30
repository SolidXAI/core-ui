export const CustomizeAttributeActionButton = ({ isActive, onClick }: any) => {
    return (
        <div
            className={`cursor-pointer w-1rem h-1rem rounded-2 flex align-items-center justify-content-center ${isActive ? 'surface-50' : ''}`}
            onClick={onClick}
        >
            <span className='pi pi-pencil text-xs'></span>
        </div>

    )
}