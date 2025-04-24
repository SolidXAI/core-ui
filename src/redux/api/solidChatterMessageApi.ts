import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from './fetchBaseQuery';

export const solidChatterMessageApi = createApi({
    reducerPath: 'solidChatterMessageApi',
    baseQuery: baseQueryWithAuth,
    endpoints: (builder) => ({
        getchatterMessage: builder.query({
            query: (qs) => {
                return `/chatter-message?populate[0]=user&populateMedia[1]=messageAttachments&${qs}`
            },
        }),
        getchatterMessageDetail: builder.query({
            query: (qs) => {
                return `/chatter-message-details?${qs}`
            },
        }),
        createChatterMessage: builder.mutation({
            query: (data) => {
                return {
                    url: '/chatter-message',
                    method: 'POST',
                    body: data
                }
            }
        })
    })
});

export const { useGetchatterMessageQuery, useLazyGetchatterMessageQuery, useCreateChatterMessageMutation, useGetchatterMessageDetailQuery, useLazyGetchatterMessageDetailQuery } = solidChatterMessageApi;