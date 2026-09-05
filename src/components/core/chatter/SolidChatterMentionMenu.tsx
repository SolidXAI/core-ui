import { useEffect, useRef } from 'react';
import './solid-chatter.css';

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
        <div className={"solid-chatter-mention-menu"}>
            {isLoading && (
                <div className={"solid-chatter-mention-empty"}>Searching users...</div>
            )}
            {!isLoading && users.length === 0 && (
                <div className={"solid-chatter-mention-empty"}>No users found</div>
            )}
            {!isLoading && users.map((user, index) => (
                <button
                    key={user.id}
                    ref={index === activeIndex ? activeOptionRef : null}
                    type="button"
                    className={`${"solid-chatter-mention-option"} ${index === activeIndex ? "solid-chatter-mention-option-active" : ''}`}
                    onMouseDown={(event) => {
                        event.preventDefault();
                        onSelect(user);
                    }}
                >
                    <span className={"solid-chatter-mention-name"}>{user.fullName || user.username}</span>
                    <span className={"solid-chatter-mention-username"}>@{user.username}</span>
                </button>
            ))}
        </div>
    );
};
