import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const solidChatterMessageApi = createApi({
    reducerPath: 'solidChatterMessageApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getchatterMessage: builder.query({
            query: ({ entityId, entityName, qs }) => {
                return `/chatter-message/getChatterMessages/${entityId}/${entityName}?populateMedia[0]=messageAttachments&${qs}`
            },
        }),
        postChatterMessage: builder.mutation({
            query: (data) => {
                return {
                    url: '/chatter-message/post',
                    method: 'POST',
                    body: data
                }
            }
        }),
        patchChatterMessage: builder.mutation({
            query: ({ id, data }) => {
                return {
                    url: `/chatter-message/${id}/complete`,
                    method: 'PATCH',
                    body: data
                }
            }
        }),
        updateChatterNoteMessage: builder.mutation({
            query: ({ id, data }) => {
                return {
                    url: `/chatter-message/${id}/note`,
                    method: 'PATCH',
                    body: data
                }
            }
        }),
        getMentionableUsers: builder.query({
            query: (qs) => {
                return `/chatter-message/mentionable-users?${qs}`
            },
        })
    })
});

export const { useGetchatterMessageQuery, useLazyGetchatterMessageQuery, usePostChatterMessageMutation, usePatchChatterMessageMutation, useUpdateChatterNoteMessageMutation, useLazyGetMentionableUsersQuery } = solidChatterMessageApi;
