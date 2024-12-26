import QUERY_KEYS from '@/constants/query-keys'
import { TargetResourceType } from '@/models'
import {
  CommentBodyType,
  interactApiRequest,
} from '@/services/interact.service'
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

export const useInteractQuery = (params: {
  id: string
  target_resource: TargetResourceType
  limit?: number
  offset?: number
}) => {
  const limit = params.limit || 6
  const initialOffset = params.offset || 0
  return useInfiniteQuery({
    queryKey: [QUERY_KEYS.GET_INTERACTS, params.id],

    queryFn: ({ pageParam = initialOffset }) => {
      const queryParams = new URLSearchParams(
        Object.entries({
          ...params,
          offset: pageParam,
          limit,
        })
          .filter(([_, value]) => value !== undefined && value !== null)
          .reduce((acc, [key, value]) => {
            acc[key] = (value as string | number).toString()
            return acc
          }, {} as Record<string, string>)
      ).toString()
      return interactApiRequest.get(queryParams ? `?${queryParams}` : '')
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

export const useListRates = (params: {
  courseId: string
  limit?: number
  offset?: number
}) => {
  return useQuery({
    queryKey: [QUERY_KEYS.GET_LIST_RATES, params.courseId],
    queryFn: () => interactApiRequest.getRates(params),
  })
}

export const useCommentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: CommentBodyType) => interactApiRequest.comment(body),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_INTERACTS, data.payload.lessonId],
      })
    },
  })
}

export const useUpdateCommentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: { content: string } }) =>
      interactApiRequest.updateComment(id, body),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.UPDATE_COMMENT, data.payload.lessonId],
      })
    },
  })
}

export const useDeleteCommentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => interactApiRequest.deleteComment(id),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_INTERACTS, data.payload.lessonId],
      })
    },
  })
}

export const useVoteCommentMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: { commentId: string; isUp: boolean }) =>
      interactApiRequest.voteComment(body),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_INTERACTS, data.payload.lessonId],
      })
    },
  })
}

export const useHeartMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: any) => interactApiRequest.heart(body),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_INTERACTS, data.payload.lessonId],
      })
    },
  })
}

export const useRateCourseMutation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: any) => interactApiRequest.rateCourse(body),
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GET_LIST_RATES, data.payload.courseId],
      })
    },
  })
}
