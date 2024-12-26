'use client'
import { Heading } from '@/components/common/heading'
import { ViewIcon } from '@/components/icons/sidebar/view-icon'
import { useListCourseManager } from '@/queries/useCourse'
import ManageCourseTable from '@/app/manage/courses/_components/manage-course-table'
import CreateCourseModal from '@/components/modals/create-course-modal'
import { Pagination } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

type Props = {
  searchParams: { page: string }
}

const LIMIT = 10

const MyCoursePage = ({ searchParams }: Props) => {
  const { page } = searchParams
  const { push } = useRouter()

  const { data, isLoading } = useListCourseManager(
    `limit=${LIMIT}&offset=${LIMIT * (Number(page || 1) - 1)}`
  )
  const totalPage = useMemo(
    () => data?.pagination?.totalPages,
    [data?.pagination?.totalPages]
  )
  return (
    <>
      <div className="flex items-center justify-between">
        <Heading icon={<ViewIcon />} title="My Courses" />
        <CreateCourseModal />
      </div>

      <ManageCourseTable data={data?.payload} isLoading={isLoading} />
      <Pagination
        initialPage={1}
        className="mx-auto w-fit mt-2"
        page={Number(page || 1)}
        total={totalPage ?? 1}
        onChange={(e) => push('/manage/courses?page=' + e, { scroll: false })}
      />
    </>
  )
}

export default MyCoursePage
