"use client"
import React, { useState, useEffect } from 'react'
import { SolidChatterHeader } from './SolidChatterHeader'
import { SolidChatterDateDivider } from './SolidChatterDateDivider'
import { SolidChatterMessageBox } from './SolidChatterMessageBox'
import { useLazyGetchatterMessageQuery } from '@/redux/api/solidChatterMessageApi'
import qs from "qs";

export const SolidChatter = ({ solidFormViewMetaData }: { solidFormViewMetaData: any }) => {
    const [activeTab, setActiveTab] = useState<'email-message' | 'log' | null>('email-message');
    const [visibleBox, setVisibleBox] = useState<'email-message' | 'log' | null>(null);
    const [messages, setMessages] = useState<any[]>([]);

    const queryData = {
        filters: {
            messageType: {
                $eqi: 'custom'
            },
            coModelEntityId: {
                $eq: solidFormViewMetaData?.data?.solidView?.model?.id
            }
        }
    };

    const queryString = qs.stringify(queryData, {
        encodeValuesOnly: true,
    });

    const [getchatterMessage, { data: chatterMessageData, isLoading, isError, isSuccess }] = useLazyGetchatterMessageQuery();
    useEffect(() => {   
        fetchData();
    }, []);

    const handleTabClick = (tab: 'email-message' | 'log') => {
        setActiveTab(tab);
        setVisibleBox(prev => (prev === tab ? null : tab));
    }
    const fetchData = async () => {
        const response = await getchatterMessage(queryString).unwrap();
        console.log('response', response);
        setMessages(response.data.records);
    }
    const messageData = [
        {
            user: "Mary Smith",
            auditType: "audit",
            time: "01:35 PM",
            auditRecord: [
                {
                    field: "Title",
                    previous: "Book Title",
                    current: "New Title"
                },
                {
                    field: "ISBN",
                    previous: "ISBN798789",
                    current: "ISBN54665"
                },
            ]
        },
        {
            user: "Mary Smith",
            auditType: "custom",
            time: "01:35 PM",
            message: 'Lorem ipsum dolor sit amet consectetur. Neque dui tempor aliquet eu quam amet id. In tortor leo interdum eget facilisis dictumst sed.'
        },
        {
            user: "Jane Doe",
            auditType: "audit",
            time: "01:35 PM",
            auditRecord: [
                {
                    field: "Status",
                    previous: "Draft",
                    current: "Available"
                },
                {
                    field: "Enable SEO",
                    previous: "Yes",
                    current: "No"
                },
            ]
        },
        {
            user: "Mary Smith",
            auditType: "custom",
            time: "01:35 PM",
            message: 'Lorem ipsum dolor sit amet consectetur. Neque dui tempor aliquet eu quam amet id. In tortor leo interdum eget facilisis dictumst sed.'
        },
        {
            user: "John Doe",
            auditType: "custom",
            time: "01:35 PM",
            message: 'Lorem ipsum dolor sit amet consectetur. Neque dui tempor aliquet eu quam amet id. In tortor leo interdum eget facilisis dictumst sed.'
        },
    ]

    return (
        <div className='h-full'>
            <SolidChatterHeader refetch={fetchData} solidFormViewMetaData={solidFormViewMetaData} activeTab={activeTab} handleTabClick={handleTabClick} visibleBox={visibleBox} />
            <div className='p-3' style={{
                overflowY: 'scroll',
                height:
                    visibleBox === 'email-message'
                        ? 'calc(100vh - 196px)'
                        : visibleBox === 'log'
                            ? 'calc(100vh - 172px)'
                            : 'calc(100vh - 65px)',
            }}>
                {isLoading ? (
                    <div className='flex align-items-center justify-content-center h-full font-medium'>
                        Loading...
                    </div>
                ) : isError ? (
                    <div className='flex align-items-center justify-content-center h-full font-medium text-red-500'>
                        Error loading messages
                    </div>
                ) : messages.length === 0 ? (
                    <div className='flex align-items-center justify-content-center h-full font-medium'>
                        No Data Available
                    </div>
                ) : (
                    [...messages].reverse().map((message) => {
                        return (
                            <div key={message.id}>
                                <SolidChatterDateDivider />
                                <SolidChatterMessageBox
                                    user={message.user.fullName}
                                    auditType={message.messageType}
                                    message={message.messageBody}
                                    time={new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                />
                            </div>
                        )
                    })
                )}
            </div>
        </div>
    )
}