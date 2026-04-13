
import styles from './chatter.module.css';

interface Props {
    date: string;
}

export const SolidChatterDateDivider = ({ date }: Props) => {
    const displayDate = (date === 'Today' || date === 'Yesterday')
        ? date
        : new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });

    return (
        <div className={styles.chatterDatetimeDivider}>
            <div className={`${styles.chatterDividerContent} absolute`}>
                {displayDate}
            </div>
        </div>
    )
}
