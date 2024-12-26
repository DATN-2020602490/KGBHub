'use client'
import ActionComment from '@/components/comment/action-comment'
import Comment from '@/components/comment/comment'
import { useSearchParams } from 'next/navigation'
import { useInteractQuery } from '@/queries/useInteract'
import InfiniteScroll from 'react-infinite-scroll-component'
import { Skeleton } from '@nextui-org/react'

type Props = {
  // data: CommentType[]
  postId: string
}

const CommentSection = ({ postId }: Props) => {
  const searchParams = useSearchParams()
  const lessonId = searchParams.get('lesson')
  const type = lessonId ? 'lesson' : 'course'
  // const [comments, setComments] = useState<any>([])
  const { data, isLoading, fetchNextPage, hasNextPage } = useInteractQuery({
    id: postId,
    target_resource: type,
  })
  if (isLoading) return null
  // const dataSorted = [...data!.payload.comments].sort(
  //   (a: CommentType, b: CommentType) =>
  //     new Date(b.createdAt as string).getTime() -
  //     new Date(a.createdAt as string).getTime()
  // )
  const comments = data!.pages.flatMap((page) => page.payload)
  const parentComments = comments.filter((comment) => comment.level === 0)
  return (
    <div>
      <ActionComment postId={postId} level={0} type={type} />
      <InfiniteScroll
        dataLength={comments?.length}
        next={fetchNextPage}
        hasMore={!!hasNextPage}
        loader={
          <div className="space-y-4 mt-4">
            {Array(3)
              .fill(null)
              .map((_, index) => (
                <div className="flex gap-x-2 w-full" key={index}>
                  <Skeleton className="rounded-full size-8" />
                  <Skeleton className="h-16 rounded-lg w-full" />
                </div>
              ))}
          </div>
        } // Hiển thị khi đang tải thêm
        endMessage={
          <span className="mt-4 size-4 bg-default-300 rounded-full block mx-auto"></span>
        }
      >
        <div className="space-y-4">
          {parentComments.map((comment) => (
            <Comment
              key={comment.id}
              comment={comment}
              data={comments}
              type={type}
            />
          ))}
        </div>
      </InfiniteScroll>
    </div>
  )
}

export default CommentSection
