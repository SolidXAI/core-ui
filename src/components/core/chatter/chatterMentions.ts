export interface ChatterMention {
    username: string;
    display_name: string;
    id: string;
}

export const parseMessageBodyMentions = (value: unknown): ChatterMention[] => {
    if (!value) return [];
    if (Array.isArray(value)) return value as ChatterMention[];
    if (typeof value !== 'string') return [];

    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
};

export const renderMessageBodyMentions = (messageBody: string | null | undefined, messageBodyMentions: unknown) => {
    const mentions = parseMessageBodyMentions(messageBodyMentions);
    if (!messageBody || mentions.length === 0) return messageBody;

    return mentions.reduce((nextMessage, mention, index) => (
        nextMessage.replace(new RegExp(`\\{\\{\\s*${index}\\s*\\}\\}`, 'g'), `@${mention.username}`)
    ), messageBody);
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const buildMessageBodyWithMentionTokens = (message: string, mentions: ChatterMention[]) => {
    const activeMentions = mentions.filter((mention, index, arr) =>
        message.includes(`@${mention.username}`) &&
        arr.findIndex(item => item.username === mention.username) === index
    );

    const body = activeMentions.reduce((nextMessage, mention, index) => {
        const mentionRegex = new RegExp(`@${escapeRegExp(mention.username)}\\b`, 'g');
        return nextMessage.replace(mentionRegex, `{{ ${index} }}`);
    }, message);

    return {
        body,
        mentions: activeMentions,
    };
};

export const getMentionCandidate = (value: string, cursorPosition: number) => {
    const beforeCursor = value.slice(0, cursorPosition);
    const match = beforeCursor.match(/(^|\s)@([\w.]*)$/);
    if (!match || match.index === undefined) return null;

    const prefixLength = match[1]?.length || 0;
    return {
        query: match[2] || '',
        start: match.index + prefixLength,
        end: cursorPosition,
    };
};
