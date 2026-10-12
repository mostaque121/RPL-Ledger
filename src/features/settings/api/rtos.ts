import { createNameListApi, type NamedItem } from './name-list'

export type Rto = NamedItem

export const rtosApi = createNameListApi('rtos', { one: 'RTO', article: 'An' })

export const rtoKeys = rtosApi.keys
export const useRtosQuery = rtosApi.useListQuery
