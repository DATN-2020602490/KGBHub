import {
  BuyCourseBodyType,
  courseManagerApiRequests,
  coursePublicApiRequests,
} from '@/services/course.service'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import QUERY_KEYS from '@/constants/query-keys'

export const useListCoursePublic = (params: {
  limit?: number
  offset?: number
  search?: string
  categories?: string
  orderBy?: string
  direction?: string
  isBestSeller?: boolean
  myOwn?: boolean
  byAuthor?: string
}) => {
  const limit = params.limit || 12
  const initialOffset = params.offset || 0

  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_LIST_COURSES_PUBLIC, params],
    queryFn: ({ pageParam = initialOffset }) => {
      const queryParams = new URLSearchParams(
        Object.entries({
          ...params,
          offset: pageParam,
          limit,
        })
          .filter(([_, value]) => value !== undefined && value !== null)
          .reduce((acc, [key, value]) => {
            acc[key] = value.toString()
            return acc
          }, {} as Record<string, string>)
      ).toString()
      return coursePublicApiRequests.getList(
        queryParams ? `?${queryParams}` : ''
      )
    },
    initialPageParam: initialOffset,
    getNextPageParam: (lastPage) => {
      const totalItemsLoaded = lastPage.pagination.page * limit
      return totalItemsLoaded < lastPage.pagination.total
        ? totalItemsLoaded
        : undefined
    },
  })
}

export const useListCourseManager = (params?: string) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_LIST_COURSES_MANAGER, params],
    queryFn: () => courseManagerApiRequests.getList(params),
  })
}

export const useDetailCourse = (courseId: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.GET_DETAIL_COURSE, courseId],
    queryFn: () => courseManagerApiRequests.get(courseId),
  })

export const useDetailCoursePublic = (courseId: string) =>
  useQuery({
    queryKey: [QUERY_KEYS.GET_DETAIL_COURSE_PUBLIC, courseId],
    queryFn: () =>
      coursePublicApiRequests.get(
        courseId,
        localStorage.getItem('accessToken') as string
      ),
  })

export const useCreateCourseMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: courseManagerApiRequests.create,
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_LIST_COURSES_MANAGER],
      })
    },
  })
}

export const useCreatePartMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      courseManagerApiRequests.createPart(id, body),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_DETAIL_COURSE, data.payload.courseId],
        exact: true,
      })
    },
  })
}

export const useApproveCourseMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => courseManagerApiRequests.approve(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_LIST_COURSES_MANAGER],
      })
    },
  })
}

export const useUpdateCourseMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: any }) =>
      courseManagerApiRequests.update(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_LIST_COURSES_MANAGER],
      })
    },
  })
}

export const useDeleteCourseMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => courseManagerApiRequests.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_LIST_COURSES_MANAGER],
      })
    },
  })
}

export const useBuyCourseMutation = () => {
  return useMutation({
    mutationFn: (body: BuyCourseBodyType) => coursePublicApiRequests.buy(body),
  })
}
