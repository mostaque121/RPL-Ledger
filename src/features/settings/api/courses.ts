import { createNameListApi, type NamedItem } from './name-list'

export type Course = NamedItem

export const coursesApi = createNameListApi('courses', { one: 'course', article: 'A' })

export const courseKeys = coursesApi.keys
export const useCoursesQuery = coursesApi.useListQuery
