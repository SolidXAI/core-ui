import React from 'react'
import styles from './chatter.module.css'
interface Props {
    date?: string
}
export const SolidChatterDateDivider = (props: Props) => {
    const { date } = props;
    return (
        <div className={styles.chatterDatetimeDivider}>
            <div className={`absolute ${styles.chatterDividerContent}`}>
            Yesterday, 29 Jan 2025
            </div>
        </div>
    )
}