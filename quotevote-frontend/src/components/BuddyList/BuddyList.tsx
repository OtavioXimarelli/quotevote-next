'use client';

import { useMemo } from 'react';
import { useQuery } from '@apollo/client/react';
import { isEmpty } from 'lodash';
import { GET_CHAT_ROOMS } from '@/graphql/queries';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import BuddyItemList from './BuddyItemList';

interface BuddyListProps {
    search?: string;
}

interface GetChatRoomsData {
    messageRooms: any[];
}

export default function BuddyList({ search }: BuddyListProps) {
    const { loading, error, data } = useQuery<GetChatRoomsData>(GET_CHAT_ROOMS, {
        fetchPolicy: 'cache-and-network',
    });

    const buddyList = useMemo(() => {
        if (error || loading || !data || isEmpty(data.messageRooms)) {
            return [];
        }

        return [...data.messageRooms]
            .sort((a: any, b: any) => new Date(b.created).getTime() - new Date(a.created).getTime())
            .map((item: any) => ({
                room: item,
                Text: item.title,
                type: item.messageType,
                avatar: item.avatar,
                unreadMessages: item.unreadMessages,
                // user: null? This list is for open chats/rooms
            }));
    }, [data, loading, error]);

    const filteredBuddyList = search
        ? buddyList.filter((buddy: any) =>
            buddy.Text?.toLowerCase().includes(search.toLowerCase())
        )
        : buddyList;

    if (loading && !data) return <LoadingSpinner size={50} />;

    return <BuddyItemList buddyList={filteredBuddyList} />;
}


