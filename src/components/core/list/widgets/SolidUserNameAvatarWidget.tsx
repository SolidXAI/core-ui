
export const SolidUserNameAvatarWidget = ({ value }: any) => {

    // use "widget": "SolidUserNameAvatarWidget" in the list view field 

    const getInitials = (fullName: string) => {
        const names = fullName.trim().split(' ');
        const initials =
            names.length === 1
                ? names[0][0]
                : names[0][0] + names[names.length - 1][0];
        return initials.toUpperCase();
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
                        width: 25,
                        height: 25,
                        borderRadius: '50%',
                        backgroundColor: bgColor,
                        color: 'white',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 600,
                        fontSize: 25 * 0.4,
                    }}
                >
                    {initials}
                </div>
                <span>{value}</span>
            </div>
        </div>
    );
};

