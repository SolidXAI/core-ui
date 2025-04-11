import React, { useMemo } from 'react'
import styles from './chatter.module.css'
import { Avatar } from 'primereact/avatar'
import { getRandomHexColor, getTextColor } from '@/helpers/getRandomColors'
import { RightArrowSvg } from '@/components/Svg/RightArrowSvg'
interface Props {
    user: string,
    auditType?: string,
    message?: any,
    time?: string,
    auditRecord?: any,
}

export const SolidChatterMessageBox = (props: Props) => {
    const { user, auditType, message, time, auditRecord } = props;
    const avatarStyle = useMemo(() => {
        const bg = getRandomHexColor()
        const color = getTextColor(bg)
        return { backgroundColor: bg, color, height: 24, width: 24, fontSize: 10, fontWeight: 600 }
    }, [])
    return (
        <div className={styles.solidChatterMessageBox}>
            <div className='flex align-items-center'>
                <div style={{ width: 32 }}>
                    <Avatar label={user[0].toUpperCase()} style={avatarStyle} shape="circle" />
                </div>
                <div className='flex align-items-center justify-content-between' style={{ width: '100%' }}>
                    <div className='text-sm'>
                        <span className='font-bold'>{user}</span>
                        <span className='ml-2' style={{ color: '#949494' }}>
                            {auditType === "fieldChange" ? 'Fields changed' : 'Sent message'}
                        </span>
                    </div>
                    <i className='pi pi-ellipsis-v text-xs' />
                </div>
            </div>
            <div className='flex align-items-center mt-1'>
                <div style={{ width: 32 }}>
                </div>
                <div style={{ width: '100%' }}>
                    <p className='mb-1 text-sm font-bold' style={{ color: '#949494' }}>
                        {time}
                    </p>
                    <div className={styles.solidMessageWrapper}>
                        {auditRecord?.length > 0 ? (
                            <div className='flex flex-column gap-2'>
                                {auditRecord.map((item: any, index: number) => (
                                    <div key={index} className='flex gap-2'>
                                        <span className='m-0 text-sm'>
                                            {"(" + item.field + ")"}
                                        </span>
                                        <span className='m-0 text-sm font-bold'>
                                            {item.previous}
                                        </span>
                                        <RightArrowSvg />
                                        <span className='m-0 text-sm font-bold text-primary'>
                                            {item.current}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className='m-0 text-sm'>
                                {message}
                            </p>
                        )}

                    </div>
                </div>
            </div>
        </div>
    )
}