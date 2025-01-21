import React from 'react'
interface Props {
    className?: string,
    value: string,
    severity: string,
}

const getSeverityColor = (severity: string): { textColor: string; backgroundColor: string } => {
    let textColor;
    let backgroundColor;

    switch (severity) {
        case 'Delivered':
            textColor = '#148C00';
            backgroundColor = '#E8FFEA';
            break;
        case 'Returned':
            textColor = '#D89100';
            backgroundColor = '#FFF7E5';
            break;
        case 'Cancelled':
            textColor = '#B50000';
            backgroundColor = '#FFEAEA';
            break;
        case 'On The Way':
            textColor = '#12415D';
            backgroundColor = '#E3F5FF';
            break;
        default:
            textColor = '#808080';
            backgroundColor = '#FFF7E5';
    }
    return { textColor, backgroundColor };
};

export const CustomTag = (props: Props) => {
    const { className, value, severity } = props;
    const severityColor = getSeverityColor(severity);

    return (
        <div className='flex'>
            <div
                className={`border-round text-xs font-semibold ${className}`}
                style={{ backgroundColor: severityColor.backgroundColor, color: severityColor.textColor, padding: '0.5rem 0.75rem' }}
            >
                {value}
            </div>
        </div>
    )
}