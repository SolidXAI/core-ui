
import './solid-chatter.css';

interface Props {
    date: string;
}

export const SolidChatterDateDivider = ({ date }: Props) => {
    const displayDate = (date === 'Today' || date === 'Yesterday')
        ? date
        : new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className={"solid-chatter-datetime-divider"}>
            <div className={`${"solid-chatter-divider-content"} absolute`}>
                {displayDate}
            </div>
        </div>
    )
}
