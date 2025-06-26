"use client"
import React, { useState, useEffect } from 'react'
import { SolidChatterHeader } from './SolidChatterHeader'
import { SolidChatterDateDivider } from './SolidChatterDateDivider'
import { SolidChatterMessageBox } from './SolidChatterMessageBox'
import { useLazyGetchatterMessageQuery, useLazyGetchatterMessageDetailQuery } from '@/redux/api/solidChatterMessageApi'
import qs from "qs";

interface FilterState {
    name: string;
    startDate: Date | null;
    endDate: Date | null;
}

export const SolidChatter = ({ modelSingularName, id, refreshChatterMessage, setRefreshChatterMessage }: { modelSingularName: any, id: any, refreshChatterMessage: boolean, setRefreshChatterMessage: (value: boolean) => void }) => {
    const [activeTab, setActiveTab] = useState<'email-message' | 'log' | null>('email-message');
    const [visibleBox, setVisibleBox] = useState<'email-message' | 'log' | null>(null);
    const [messages, setMessages] = useState<any[]>([]);
    const [filters, setFilters] = useState<FilterState>({
        name: '',
        startDate: null,
        endDate: null
    });

    const queryDataChatterMessage = {
        filters: {
            messageType: {
                $eqi: 'custom'
            },
            coModelName: {
                $eq: modelSingularName
            },
            coModelEntityId: {
                $eq: id
            }
        }
    };

    const queryStringChatterMessage = qs.stringify(queryDataChatterMessage, {
        encodeValuesOnly: true,
    });

    const queryDataChatterMessageDetail = {
        populate: ['chatterMessage.user'],
        filters: {
            chatterMessage: {
                coModelName: {
                    $eq: modelSingularName
                },
                coModelEntityId: {
                    $eq: id
                }
            }
        }
    };

    const queryStringChatterMessageDetail = qs.stringify(queryDataChatterMessageDetail, {
        encodeValuesOnly: true,
    });

    const [getchatterMessage, { data: chatterMessageData, isLoading: isCustomLoading, isError: isCustomError }] = useLazyGetchatterMessageQuery();
    const [getchatterMessageDetail, { data: auditMessageData, isLoading: isAuditLoading, isError: isAuditError }] = useLazyGetchatterMessageDetailQuery();

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
    }, [filters]);

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
            return date.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        }
    };

    const groupAuditMessages = (messages: any[]) => {
        const groupedMessages: any[] = [];
        const timeMap = new Map();

        messages.forEach((msg) => {
            if (msg.auditType === 'audit') {
                const timeKey = msg.time;
                if (timeMap.has(timeKey)) {
                    const existingMsg = timeMap.get(timeKey);
                    existingMsg.auditRecord.push(...msg.auditRecord);
                } else {
                    timeMap.set(timeKey, { ...msg });
                    groupedMessages.push(timeMap.get(timeKey));
                }
            } else {
                groupedMessages.push(msg);
            }
        });

        return groupedMessages;
    };

    const filterMessages = (messages: any[]) => {
        console.log("Current filters:", filters);
        return messages.filter(msg => {
            if (filters.name && !msg.user.toLowerCase().includes(filters.name.toLowerCase())) {
                return false;
            }

            const messageDate = new Date(msg.createdAt);
            if (filters.startDate) {
                const startDate = new Date(filters.startDate);
                startDate.setHours(0, 0, 0, 0);
                if (messageDate < startDate) {
                    return false;
                }
            }
            if (filters.endDate) {
                const endDate = new Date(filters.endDate);
                endDate.setHours(23, 59, 59, 999);
                if (messageDate > endDate) {
                    return false;
                }
            }

            return true;
        });
    };

    const fetchData = async () => {
        try {
            const customResponse = await getchatterMessage(queryStringChatterMessage).unwrap();
            const customMessages = customResponse.data.records.map((msg: any) => ({
                id: msg.id,
                user: msg.user?.fullName || "System",
                auditType: "custom",
                message: msg.messageBody,
                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                createdAt: msg.createdAt,
                date: formatDate(msg.createdAt),
                media: msg._media
            }));

            const auditResponse = await getchatterMessageDetail(queryStringChatterMessageDetail).unwrap();
            const auditMessages = auditResponse.data.records.map((msg: any) => ({
                id: msg.id,
                user: msg.chatterMessage.user?.fullName || "System",
                auditType: "audit",
                time: new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                auditRecord: [{
                    field: msg.fieldName,
                    previous: msg.oldValueDisplay || msg.oldValue || 'None',
                    current: msg.newValueDisplay || msg.newValue
                }],
                createdAt: msg.createdAt,
                date: formatDate(msg.createdAt)
            }));

            const allMessages = [...customMessages, ...auditMessages].sort((a, b) => 
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            const groupedMessages = groupAuditMessages(allMessages);
            const filteredMessages = filterMessages(groupedMessages);
            setMessages(filteredMessages);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    }

    const handleFilterChange = (newFilters: FilterState) => {
        console.log("New filters received:", newFilters);
        setFilters(prev => {
            console.log("Previous filters:", prev);
            const updatedFilters = {
                name: newFilters.name,
                startDate: newFilters.startDate,
                endDate: newFilters.endDate
            };
            console.log("Updated filters:", updatedFilters);
            return updatedFilters;
        });
    };

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
            />
            <div className='p-3' style={{
                overflowY: 'scroll',
                height:
                    visibleBox === 'email-message'
                        ? 'calc(100vh - 196px)'
                        : visibleBox === 'log'
                            ? 'calc(100vh - 172px)'
                            : 'calc(100vh - 65px)',
            }}>
                {(isCustomLoading || isAuditLoading) ? (
                    <div className='flex align-items-center justify-content-center h-full font-medium'>
                        Loading...
                    </div>
                ) : messages.length === 0 ? (
                    <div className='flex align-items-center justify-content-center h-full font-medium'>
                        No Data Available
                    </div>
                ) : (
                    messages.map((message, index) => {
                        const showDateDivider = index === 0 || message.date !== messages[index - 1].date;
                        return (
                            <div key={message.id}>
                                {showDateDivider && <SolidChatterDateDivider date={message.date} />}
                                <SolidChatterMessageBox
                                    user={message.user}
                                    auditType={message.auditType}
                                    message={message.message}
                                    time={message.time}
                                    auditRecord={message.auditRecord}
                                    media={message.media}
                                />
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    )
}