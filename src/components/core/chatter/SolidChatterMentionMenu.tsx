import { useEffect, useRef } from 'react';
import styles from './chatter.module.css';

interface Props {
    isLoading: boolean;
    users: any[];
    activeIndex: number;
    onSelect: (user: any) => void;
}

export const SolidChatterMentionMenu = ({ isLoading, users, activeIndex, onSelect }: Props) => {
    const activeOptionRef = useRef<HTMLButtonElement | null>(null);

    useEffect(() => {
        activeOptionRef.current?.scrollIntoView({
            block: 'nearest',
        });
    }, [activeIndex]);

    return (
        <div className={styles.chatterMentionMenu}>
            {isLoading && (
                <div className={styles.chatterMentionEmpty}>Searching users...</div>
            )}
            {!isLoading && users.length === 0 && (
                <div className={styles.chatterMentionEmpty}>No users found</div>
            )}
            {!isLoading && users.map((user, index) => (
                <button
                    key={user.id}
                    ref={index === activeIndex ? activeOptionRef : null}
                    type="button"
                    className={`${styles.chatterMentionOption} ${index === activeIndex ? styles.chatterMentionOptionActive : ''}`}
                    onMouseDown={(event) => {
                        event.preventDefault();
                        onSelect(user);
                    }}
                >
                    <span className={styles.chatterMentionName}>{user.fullName || user.username}</span>
                    <span className={styles.chatterMentionUsername}>@{user.username}</span>
                </button>
            ))}
        </div>
    );
};
