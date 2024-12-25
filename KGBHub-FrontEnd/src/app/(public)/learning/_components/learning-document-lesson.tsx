'use client'

import BookmarkLesson from '@/app/(public)/learning/_components/bookmark-lesson'
import { Heading } from '@/components/common/heading'
import { useCourse } from '@/contexts/course'
import { lessonPublicApiRequest } from '@/services/lesson.service'
import { useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

type Props = {
  data: any
}

const LearningDocumentLesson = ({ data }: Props) => {
  const [alertDisplayed, setAlertDisplayed] = useState(false)
  const { courseId } = useParams()
  const { setCourseRefresh, progress } = useCourse()
  const courseProgress = progress?.find(
    (course: any) => course.courseId === (courseId)
  )

  useEffect(() => {
    const finishLessonHandler = async () => {
      try {
        if (
          progress
            ?.find((course: any) => course.courseId === courseId)
            ?.lessons.some((l: any) => l.lessonId === data.id)
        )
          return null
        const res = await lessonPublicApiRequest.finish(data.id)
        if (res.status === 200) {
          toast.success('Lesson finished', { hideProgressBar: true })
          setCourseRefresh((prev: boolean) => !prev)
        }
      } catch (error) {}
    }
    const windowHeight = window.innerHeight
    const documentHeight = document.body.clientHeight
    if (documentHeight <= windowHeight) finishLessonHandler()
    function handleScroll() {
      if (!alertDisplayed) {
        const scrollPosition = window.scrollY

        if (scrollPosition > (documentHeight - windowHeight) * 0.5) {
          finishLessonHandler()
          setAlertDisplayed(true)
          window.removeEventListener('scroll', handleScroll) // Ngừng lắng nghe sự kiện scroll sau khi hiển thị alert
        }
      }
    }

    window.addEventListener('scroll', handleScroll)

    return () => {
      window.removeEventListener('scroll', handleScroll)
    }
  }, [JSON.stringify(progress), data.id])
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Heading title={data.lessonName} className="text-4xl" />
        <BookmarkLesson />
      </div>
      <div
        className="entry-content"
        // Prevent XSS Attack recommen from React Docs
        dangerouslySetInnerHTML={{
          __html: data.content || '',
        }}
      ></div>
    </div>
  )
}

export default LearningDocumentLesson
