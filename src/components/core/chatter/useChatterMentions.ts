import { type ChangeEvent, type KeyboardEvent, type MouseEvent, type RefObject, useEffect, useState } from 'react';
import { useLazyGetusersQuery } from '../../../redux/api/userApi';
import { ChatterMention, getMentionCandidate } from './chatterMentions';

interface UseChatterMentionsProps {
    value: string;
    onChange: (value: string) => void;
    textareaRef: RefObject<HTMLTextAreaElement | null>;
}

export const useChatterMentions = ({ value, onChange, textareaRef }: UseChatterMentionsProps) => {
    const [mentions, setMentions] = useState<ChatterMention[]>([]);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionRange, setMentionRange] = useState<{ start: number; end: number } | null>(null);
    const [mentionSuggestions, setMentionSuggestions] = useState<any[]>([]);
    const [activeMentionIndex, setActiveMentionIndex] = useState(0);
    const [getUsers, { isFetching: isFetchingMentionUsers }] = useLazyGetusersQuery();

    const closeMentionMenu = () => {
        setMentionRange(null);
        setMentionQuery('');
        setMentionSuggestions([]);
        setActiveMentionIndex(0);
    };

    const updateMentionState = (nextValue: string, cursorPosition: number) => {
        const candidate = getMentionCandidate(nextValue, cursorPosition);
        if (!candidate) {
            closeMentionMenu();
            return;
        }

        setMentionRange({ start: candidate.start, end: candidate.end });
        setMentionQuery(candidate.query);
    };

    const handleMentionTextChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
        const nextValue = event.target.value;
        onChange(nextValue);
        updateMentionState(nextValue, event.target.selectionStart ?? nextValue.length);
    };

    const handleMentionKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (!mentionRange) return;

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setActiveMentionIndex(prev => {
                if (mentionSuggestions.length === 0) return 0;
                return (prev + 1) % mentionSuggestions.length;
            });
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setActiveMentionIndex(prev => {
                if (mentionSuggestions.length === 0) return 0;
                return (prev - 1 + mentionSuggestions.length) % mentionSuggestions.length;
            });
            return;
        }

        if (event.key === 'Enter' || event.key === 'Tab') {
            if (mentionSuggestions[activeMentionIndex]) {
                event.preventDefault();
                handleSelectMention(mentionSuggestions[activeMentionIndex]);
            }
            return;
        }

        if (event.key === 'Escape') {
            event.preventDefault();
            closeMentionMenu();
        }
    };

    const handleMentionKeyUp = (event: KeyboardEvent<HTMLTextAreaElement>) => {
        if (['ArrowDown', 'ArrowUp', 'Enter', 'Tab', 'Escape'].includes(event.key)) return;
        const target = event.currentTarget;
        updateMentionState(target.value, target.selectionStart ?? target.value.length);
    };

    const handleMentionClick = (event: MouseEvent<HTMLTextAreaElement>) => {
        updateMentionState(event.currentTarget.value, event.currentTarget.selectionStart ?? event.currentTarget.value.length);
    };

    const handleSelectMention = (user: any) => {
        if (!mentionRange) return;
        const username = user?.username;
        if (!username) return;

        const mention: ChatterMention = {
            username,
            display_name: user?.fullName || username,
            id: String(user?.id),
        };
        const mentionText = `@${mention.username}`;
        const nextValue = `${value.slice(0, mentionRange.start)}${mentionText} ${value.slice(mentionRange.end)}`;
        const nextCursorPosition = mentionRange.start + mentionText.length + 1;

        onChange(nextValue);
        setMentions(prev => (
            prev.some(item => item.id === mention.id || item.username === mention.username)
                ? prev
                : [...prev, mention]
        ));
        closeMentionMenu();

        window.requestAnimationFrame(() => {
            textareaRef.current?.focus();
            textareaRef.current?.setSelectionRange(nextCursorPosition, nextCursorPosition);
        });
    };

    const resetMentions = (nextMentions: ChatterMention[] = []) => {
        setMentions(nextMentions);
        closeMentionMenu();
    };

    useEffect(() => {
        if (!mentionRange) return;

        let isActive = true;
        const timeout = window.setTimeout(async () => {
            try {
                const encodedQuery = encodeURIComponent(mentionQuery);
                const queryString = mentionQuery
                    ? `filters[username][$containsi]=${encodedQuery}&limit=8`
                    : 'limit=8';
                const response = await getUsers(queryString).unwrap();
                if (!isActive) return;
                setMentionSuggestions(response?.data?.records || []);
                setActiveMentionIndex(0);
            } catch (error) {
                if (isActive) setMentionSuggestions([]);
            }
        }, 180);

        return () => {
            isActive = false;
            window.clearTimeout(timeout);
        };
    }, [mentionQuery, mentionRange, getUsers]);

    return {
        mentions,
        setMentions,
        mentionRange,
        mentionSuggestions,
        activeMentionIndex,
        isFetchingMentionUsers,
        handleMentionTextChange,
        handleMentionKeyDown,
        handleMentionKeyUp,
        handleMentionClick,
        handleSelectMention,
        resetMentions,
    };
};
