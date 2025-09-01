// components/OnlineStatusWrapper.tsx
'use client';

import useOfflineStatus from '@/helpers/useOfflineStatus';
import OfflineNotice from './OfflineNotice';

export const OnlineStatusWrapper = () => {
    const isOffline = useOfflineStatus();

    return isOffline ? <OfflineNotice /> : null;
}