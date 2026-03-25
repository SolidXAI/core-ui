
import styles from './chatter.module.css';

interface Props {
    date: string;
}

export const SolidChatterDateDivider = ({ date }: Props) => {
    return (
        <div className={styles.chatterDatetimeDivider}>
            <div className={`${styles.chatterDividerContent} absolute`}>
                {new Date(date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
        </div>
    )
}