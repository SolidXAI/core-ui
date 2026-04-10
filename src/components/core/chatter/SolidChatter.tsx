
import React, { useState, useEffect } from 'react'
import { SolidChatterHeader } from './SolidChatterHeader'
import { SolidChatterDateDivider } from './SolidChatterDateDivider'
import { SolidChatterMessageBox } from './SolidChatterMessageBox'
import { useLazyGetchatterMessageQuery } from '../../../redux/api/solidChatterMessageApi'
import qs from "qs";
import { ERROR_MESSAGES } from '../../../constants/error-messages'
import { permissionExpression } from '../../../helpers/permissions'
import { SolidButton, SolidMessage } from '../../shad-cn-ui'
import { Inbox, Loader2 } from 'lucide-react'

interface FilterState {
    name: string;
    startDate: Date | null;
    endDate: Date | null;
}

export const SolidChatter = ({ modelSingularName, id, refreshChatterMessage, setRefreshChatterMessage, actionsAllowed=[] }: { modelSingularName: any, id: any, refreshChatterMessage: boolean, setRefreshChatterMessage: (value: boolean) => void , actionsAllowed?:string[]}) => {    
    const [activeTab, setActiveTab] = useState<'email-message' | 'log' | null>('email-message');
    const [visibleBox, setVisibleBox] = useState<'email-message' | 'log' | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [limit, setLimit] = useState<number>(25);
    const [totalRecords, setTotalRecords] = useState<number>(0);
    const [filters, setFilters] = useState<FilterState>({
        name: '',
        startDate: null,
        endDate: null
    });

    const [getchatterMessage, { isLoading: isChatterLoading }] = useLazyGetchatterMessageQuery();

    useEffect(() => {
        if (refreshChatterMessage) {
            if (id !== 'new') {
                fetchData();
                setRefreshChatterMessage(false);
            }
        }
    }, [refreshChatterMessage]);

    useEffect(() => {
        if (id !== 'new') {
            fetchData();
        }
    }, [filters, limit]);

    const handleTabClick = (tab: 'email-message' | 'log') => {
        setActiveTab(tab);
        setVisibleBox(prev => (prev === tab ? null : tab));
    }

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) {
            return 'Today';
        } else if (date.toDateString() === yesterday.toDateString()) {
            return 'Yesterday';
        } else {
            return dateString;
        }
    };

    const fetchData = async () => {
        try {
            const queryData: any = {
                populate: ['user', 'chatterMessageDetails'],
                limit: limit
            };

            if (filters.name) {
                queryData.filters = queryData.filters || {};
                queryData.filters['user'] = { fullName: { $containsi: filters.name }};
            }
            if (filters.startDate && filters.endDate) {
                queryData.filters = queryData.filters || {};
                queryData.filters.createdAt = {
                    $between: [filters.startDate.toISOString(), filters.endDate.toISOString()]
                };
            } else if (filters.startDate) {
                queryData.filters = queryData.filters || {};
                queryData.filters.createdAt = { $gte: filters.startDate.toISOString() };
            } else if (filters.endDate) {
                queryData.filters = queryData.filters || {};
                queryData.filters.createdAt = { $lte: filters.endDate.toISOString() };
            }

            const queryString = qs.stringify(queryData, {
                encodeValuesOnly: true,
            });
            const response = await getchatterMessage({
                entityId: id,
                entityName: modelSingularName,
                qs: queryString
            }).unwrap();
            const processedMessages = response.data.records.map((msg: any) => {
                if (msg.messageType === 'custom') {
                    // Custom message
                    return {
                        id: msg.id,
                        user: msg.user?.fullName || "System",
                        messageType: "custom",
                        message: msg.messageBody,
                        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        createdAt: msg.createdAt,
                        date: formatDate(msg.createdAt),
                        media: msg._media,
                        messageSubType: msg.messageSubType,
                        modelDisplayName: msg.modelDisplayName,
                        modelUserKey: msg.modelUserKey
                    };
                } else {
                    // Audit message
                    const auditRecord = msg.chatterMessageDetails?.map((detail: any) => ({
                        field: detail.fieldName,
                        fieldDisplayName: detail.fieldDisplayName,
                        fieldType: detail.fieldType,
                        previous: detail.oldValue,
                        current: detail.newValue,
                        previousDisplay: detail.oldValueDisplay,
                        currentDisplay: detail.newValueDisplay,
                    })) || [];

                    return {
                        id: msg.id,
                        user: msg.user?.fullName || "System",
                        messageType: "audit",
                        time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        auditRecord: auditRecord,
                        createdAt: msg.createdAt,
                        date: formatDate(msg.createdAt),
                        messageSubType: msg.messageSubType,
                        modelDisplayName: msg.modelDisplayName,
                        modelUserKey: msg.modelUserKey,
                        message: msg.messageBody,
                    };
                }
            });
            setMessages(processedMessages);
            setTotalRecords(response?.data?.meta?.totalRecords || 0);
        } catch (error) {
            console.error(ERROR_MESSAGES.FETCHING_MESSAGE, error);
        }
    }

    const handleFilterChange = (newFilters: FilterState) => {
        setFilters({
            name: newFilters.name,
            startDate: newFilters.startDate,
            endDate: newFilters.endDate
        });
        setLimit(25);
    };

    const handleLoadMore = () => {
        setLimit(prevLimit => prevLimit + 25);
    };

    const canViewMessages = actionsAllowed.includes(`${permissionExpression('chatterMessage', 'findMany')}`);

    const renderLoadingState = () => (
        <div className='flex flex-column align-items-center justify-content-center gap-2 h-full text-center text-color-secondary'>
            <Loader2 size={20} className='text-primary animate-spin' />
            <span className='text-sm'>Loading recent activity…</span>
        </div>
    );

    const renderEmptyState = () => {
        const isLogComposerOpen = visibleBox === 'log';
        return (
        <div className='flex align-items-center justify-content-center h-full'>
            <div className='flex flex-column align-items-center gap-2 text-center text-color-secondary px-3'>
                <div className='p-3 border-round bg-primary-reverse text-primary'>
                    <Inbox size={20} />
                </div>
                <p className='m-0 text-base font-medium text-color'>No activity yet</p>
                <p className='m-0 text-sm'>Log your first internal note or send a message to get things started.</p>
                <SolidButton size='sm' variant='outline' onClick={() => handleTabClick('log')}>
                    {isLogComposerOpen ? 'Cancel' : 'Log a note'}
                </SolidButton>
            </div>
        </div>
        );
    };

    const permissionError = () => (
        <div className='p-3'>
            <SolidMessage severity='warn' text="You do not have permission to view these messages." className='justify-content-start' />
        </div>
    );

    const renderMessages = () => (
        <div className='flex flex-column gap-3'>
            {messages.map((message, index) => {
                const showDateDivider = index === 0 || message.date !== messages[index - 1].date;
                return (
                    <div key={message.id}>
                        {showDateDivider && <SolidChatterDateDivider date={message.date} />}
                        <SolidChatterMessageBox
                            user={message.user}
                            messageType={message.messageType}
                            message={message.message}
                            time={message.time}
                            auditRecord={message.auditRecord}
                            media={message.media}
                            messageSubType={message.messageSubType}
                            modelDisplayName={message.modelDisplayName}
                            modelUserKey={message.modelUserKey}
                        />
                    </div>
                );
            })}
            {totalRecords > messages.length && (
                <div className='flex justify-content-center'>
                    <SolidButton
                        type='button'
                        size='sm'
                        variant='outline'
                        onClick={handleLoadMore}
                    >
                        Load more
                    </SolidButton>
                </div>
            )}
        </div>
    );

    return (
        <div className='h-full'>
            <SolidChatterHeader
                id={id}
                refetch={fetchData}
                modelSingularName={modelSingularName}
                activeTab={activeTab}
                handleTabClick={handleTabClick}
                visibleBox={visibleBox}
                onFilterChange={handleFilterChange}
                onComposerCancel={() => setVisibleBox(null)}
            />
            <div className=' solid-chatter-body' style={{
                paddingRight: '10px',
                overflowY: 'scroll',
                height:
                    visibleBox === 'email-message'
                        ? 'calc(100vh - 196px)'
                        : visibleBox === 'log'
                            ? 'calc(100vh - 350px)'
                            : 'calc(100vh - 175px)',
            }}>
                {isChatterLoading
                    ? renderLoadingState()
                    : !canViewMessages
                        ? permissionError()
                        : messages.length === 0
                            ? renderEmptyState()
                            : renderMessages()
                }
            </div>
        </div>
    )
}
