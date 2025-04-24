import { SolidListFieldWidgetProps } from "@/types/solid-core";


export const AvatarWidget = ({ value }: any) => {
    // use "widget": "SolidUserNameAvatarWidget" in the list view field 


    const getInitials = (value: string) => {
        if (value) {
            const names = value?.trim().split(' ');
            const initials =
                names.length === 1
                    ? names[0][0]
                    : names[0][0] + names[names.length - 1][0];
            return initials.toUpperCase();
        } else {
            return ""
        }
    };

    const getColorFromInitials = (initials: string) => {
        let hash = 0;
        for (let i = 0; i < initials.length; i++) {
            hash = initials.charCodeAt(i) + ((hash << 5) - hash);
        }
        const hue = Math.abs(hash) % 360;
        return `hsl(${hue}, 60%, 60%)`; // nice pastel color
    };

    const initials = getInitials(value);
    const bgColor = getColorFromInitials(initials);

    return (
        <div className="solid-table-row">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                    style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        backgroundColor: bgColor,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: 12,
                        boxShadow: '0 0 0 2px rgba(0,0,0,0.1)',
                    }}
                >
                    {initials}
                </div>
                <span>{value}</span>
            </div>
        </div>
    );
};





export const SolidRelationAvatarWidget = ({ rowData, solidListViewMetaData, fieldMetadata, column }: SolidListFieldWidgetProps) => {
    const manyToManyFieldData = rowData[column.attrs.name];

    // This is the userkey that will be present within the rowData.
    if (manyToManyFieldData) {
        // Since this is a many-to-one field, we fetch the user key field of the associated model.
        const userKeyField = fieldMetadata?.relationModel?.userKeyField?.name;

        const manyToManyColVal = manyToManyFieldData.map((f: any) => f[userKeyField]);

        // TODO: change this to use an anchor tag so that on click we open that entity form view. 
        return (
            <>
                {manyToManyColVal.length > 0 &&

                    manyToManyColVal.map((m: any) =>
                        <AvatarWidget value={m}></AvatarWidget>

                    )
                }
            </>
        )
    }
    else {
        return <span></span>
    }
};
