"use client"
import React, { useState } from 'react'
import { SolidChatterHeader } from './SolidChatterHeader'
import { SolidChatterDateDivider } from './SolidChatterDateDivider'
import { SolidChatterMessageBox } from './SolidChatterMessageBox'

export const SolidChatter = () => {
    const [activeTab, setActiveTab] = useState<'email-message' | 'log' | null>('email-message');
    const [visibleBox, setVisibleBox] = useState<'email-message' | 'log' | null>(null);

    const handleTabClick = (tab: 'email-message' | 'log') => {
        setActiveTab(tab);
        setVisibleBox(prev => (prev === tab ? null : tab));
    }

    const messageData = [
        {
            user: "Mary Smith",
            auditType: "fieldChange",
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
            auditType: "message",
            time: "01:35 PM",
            message: 'Lorem ipsum dolor sit amet consectetur. Neque dui tempor aliquet eu quam amet id. In tortor leo interdum eget facilisis dictumst sed.'
        },
        {
            user: "Jane Doe",
            auditType: "fieldChange",
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
            auditType: "message",
            time: "01:35 PM",
            message: 'Lorem ipsum dolor sit amet consectetur. Neque dui tempor aliquet eu quam amet id. In tortor leo interdum eget facilisis dictumst sed.'
        },
        {
            user: "John Doe",
            auditType: "message",
            time: "01:35 PM",
            message: 'Lorem ipsum dolor sit amet consectetur. Neque dui tempor aliquet eu quam amet id. In tortor leo interdum eget facilisis dictumst sed.'
        },
    ]

    return (
        <div className='h-full'>
            <SolidChatterHeader activeTab={activeTab} handleTabClick={handleTabClick} visibleBox={visibleBox} />
            <div className='p-3' style={{
                overflowY: 'scroll',
                height:
                    visibleBox === 'email-message'
                        ? 'calc(100vh - 196px)'
                        : visibleBox === 'log'
                            ? 'calc(100vh - 172px)'
                            : 'calc(100vh - 65px)',
            }}>
                {messageData.length === 0 ? (
                    <div className='flex align-items-center justify-content-center h-full font-medium'>
                        No Data Available
                    </div>
                ) : (
                    messageData.map((message, index) => {
                        return (
                            <div key={index}>
                                <SolidChatterDateDivider />
                                <SolidChatterMessageBox
                                    user={message.user}
                                    auditType={message.auditType}
                                    message={message.message}
                                    time={message.time}
                                    auditRecord={message.auditRecord}
                                />
                            </div>
                        )
                    })
                )
                }
            </div>
        </div>
    )
}