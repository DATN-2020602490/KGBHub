'use client'
import CourseCard, { CourseCardSkeleton } from '@/components/course/course-card'
import { useListCoursePublic } from '@/queries/useCourse'
import { useState } from 'react'
import InfiniteScroll from 'react-infinite-scroll-component'

const COURSES_LIMIT = 12

const RecentCourseSection = () => {
  const [offset, setOffset] = useState(0)
  console.log(offset)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, status } =
    useListCoursePublic({
      limit: COURSES_LIMIT,
      offset,
    })
  const recentCourses = data?.pages.flatMap((page) => page.payload) || []
  return (
    <InfiniteScroll
      dataLength={recentCourses?.length}
      next={fetchNextPage}
      hasMore={!!hasNextPage}
      loader={
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full mt-4">
          {Array(8)
            .fill(null)
            .map((_, index) => (
              <CourseCardSkeleton key={index} />
            ))}
        </div>
      } // Hiển thị khi đang tải thêm
      endMessage={
        <span className="mt-4 size-4 bg-default-300 rounded-full block mx-auto"></span>
      }
    >
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
        {recentCourses?.map((course) => (
          <CourseCard key={course.id} data={course} />
        ))}
      </div>
    </InfiniteScroll>
  )
}

export default RecentCourseSection
