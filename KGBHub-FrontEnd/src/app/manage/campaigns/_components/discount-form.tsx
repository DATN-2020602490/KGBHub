'use client'

import { SearchIcon } from '@/components/icons/searchicon'
import FileUpload from '@/components/input/file-upload'
import { CampaignType } from '@/constants'
import { convertObjectToFormData, generateMediaLink } from '@/lib/utils'
import { Course } from '@/models'
import { useListCoursePublic } from '@/queries/useCourse'
import {
  DiscountBody,
  DiscountBodyType,
} from '@/schemaValidations/campaign.schema'
import { zodResolver } from '@hookform/resolvers/zod'
import {
  Avatar,
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Spinner,
  Switch,
  Textarea,
  useDisclosure,
} from '@nextui-org/react'
import _ from 'lodash'
import { CalendarDays, X, Check, CheckIcon } from 'lucide-react'
import { Dispatch, SetStateAction, useState } from 'react'
import DatePicker from 'react-date-picker'
import { Controller, useForm } from 'react-hook-form'

type Props = {
  data?: any
  onSubmit?: any
}

export default function DiscountForm({ data, onSubmit }: Props) {
  const [loading, setLoading] = useState(false)
  const [coursesSelected, setCoursesSelected] = useState<
    (Course & { discount?: number })[]
  >([])
  const form = useForm<DiscountBodyType>({
    resolver: zodResolver(DiscountBody),
    defaultValues: {
      cover: data?.coverFileId ?? '',
      startAt: data?.startAt ?? '',
      endAt: data?.endAt ?? '',
      requireJoined: data?.requireJoined ?? 'true',
    },
  })

  const submit = async (values: any) => {
    setLoading(true)
    values.type = CampaignType.DISCOUNT
    values.courseIds = JSON.stringify(
      coursesSelected.map((course) => ({
        id: course.id,
        discount: course.discount,
      }))
    )
    console.log(values)
    const formData = convertObjectToFormData(values)
    await onSubmit(formData)
    setLoading(false)
  }
  const { errors } = form.formState
  return (
    <form onSubmit={form.handleSubmit(submit)} className="space-y-4">
      <div className="flex gap-x-8 items-end">
        <div className="w-full space-y-4">
          <Controller
            name="name"
            control={form.control}
            render={({ field }) => (
              <Input
                isRequired
                label="Name"
                variant="bordered"
                labelPlacement="outside"
                placeholder="Enter name..."
                errorMessage={errors.name?.message}
                {...field}
              />
            )}
          />
          <div className="grid grid-cols-2 gap-4">
            <Controller
              control={form.control}
              name="startAt"
              render={({ field }) => (
                <div className="space-y-2">
                  <span className="relative text-foreground-500 after:content-['*'] after:text-danger after:ml-0.5">
                    Start at
                  </span>
                  <DatePicker
                    className="w-full"
                    dayPlaceholder="dd"
                    monthPlaceholder="mm"
                    yearPlaceholder="yyyy"
                    onChange={(date) => field.onChange(date)}
                    value={field.value}
                    calendarIcon={!field.value ? <CalendarDays /> : null}
                    clearIcon={field.value ? <X /> : null}
                  />
                </div>
              )}
            />
            <Controller
              control={form.control}
              name="endAt"
              render={({ field }) => (
                <div className="space-y-2">
                  <span className="relative text-foreground-500 after:content-['*'] after:text-danger after:ml-0.5">
                    End at
                  </span>
                  <DatePicker
                    className="w-full"
                    dayPlaceholder="dd"
                    monthPlaceholder="mm"
                    yearPlaceholder="yyyy"
                    onChange={(date) => field.onChange(date)}
                    value={field.value}
                    calendarIcon={!field.value ? <CalendarDays /> : null}
                    clearIcon={field.value ? <X /> : null}
                  />
                </div>
              )}
            />
          </div>
        </div>
        <div className="w-fit mx-auto">
          <FileUpload
            name="cover"
            form={form}
            placeholder="Upload thumbnail. "
          />
        </div>
      </div>
      <Controller
        name="description"
        control={form.control}
        render={({ field }) => (
          <Textarea
            isRequired
            label="Description"
            variant="bordered"
            labelPlacement="outside"
            placeholder="Enter description..."
            errorMessage={errors.description?.message}
            {...field}
          />
        )}
      />
      <Controller
        control={form.control}
        name="requireJoined"
        render={({ field }) => (
          <div className="space-y-2">
            <span className="relative text-foreground-500 after:text-danger after:ml-0.5 block">
              Require joined
            </span>
            <Switch
              isSelected={field.value}
              size="lg"
              color="primary"
              startContent={<X />}
              endContent={<Check />}
              {...field}
            />
          </div>
        )}
      />
      <DiscounSetting
        coursesSelected={coursesSelected}
        setCoursesSelected={setCoursesSelected}
      />
      <Button
        className="flex items-center ml-auto"
        color="primary"
        type="submit"
        disabled={loading}
      >
        {loading ? <Spinner color="success" /> : 'Save'}
      </Button>
    </form>
  )
}

const DiscounSetting = ({
  coursesSelected,
  setCoursesSelected,
}: {
  coursesSelected: (Course & {
    discount?: number
  })[]
  setCoursesSelected: Dispatch<
    SetStateAction<
      (Course & {
        discount?: number
      })[]
    >
  >
}) => {
  const [search, setSearch] = useState('')

  const { data } = useListCoursePublic({ search })
  const { isOpen, onOpen, onOpenChange } = useDisclosure()
  return (
    <>
      <Button onPress={onOpen}>Setting</Button>
      <Modal
        isOpen={isOpen}
        onOpenChange={onOpenChange}
        size="4xl"
        scrollBehavior="inside"
      >
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                Select Courses
              </ModalHeader>
              <ModalBody className="min-h-[60vh]">
                <div className="flex-1 px-4 py-3 lg:px-5">
                  <Input
                    startContent={<SearchIcon />}
                    isClearable
                    className="w-full"
                    classNames={{
                      input: 'w-full',
                      mainWrapper: 'w-full',
                    }}
                    onChange={_.debounce((e) => setSearch(e.target.value), 500)}
                    onClear={() => setSearch('')}
                    placeholder="Search names or user ID"
                  />

                  <div className="mt-5 flex w-full flex-col gap-2">
                    {coursesSelected?.map((course) => (
                      <div
                        key={course.id}
                        className="flex cursor-pointer items-center gap-3 rounded-md border border-controls-border-border-base px-3.5 py-2 hover:bg-background-background-mid"
                        onClick={() =>
                          setCoursesSelected((prev) =>
                            prev.some(
                              (selectCourse) => course.id == selectCourse.id
                            )
                              ? prev.filter(
                                  (selectCourse) => course.id != selectCourse.id
                                )
                              : [...prev, course]
                          )
                        }
                      >
                        <Avatar
                          src={generateMediaLink(course.thumbnailFileId)}
                          className="h-9 w-9 shrink-0 border-none lg:h-11 lg:w-11"
                        ></Avatar>
                        <div className="w-full">
                          <div className="text-sm lg:text-base">{`${
                            course.courseName || ''
                          } `}</div>
                          <div className="h-3 text-xs font-medium leading-3 lg:h-5 lg:text-xs lg:leading-5">
                            {course.courseName || ''}
                          </div>
                        </div>
                        <div className="flex gap-x-4 items-center">
                          {(() => {
                            const isSelected = coursesSelected.some(
                              (selectCourse) => course.id == selectCourse.id
                            )
                            return (
                              <>
                                <Input
                                  value={course.discount + ''}
                                  type="number"
                                  placeholder="Discount(%)"
                                  onClick={(e) => {
                                    e.stopPropagation()
                                  }}
                                  onChange={(e) => {
                                    const newDiscount = Number(e.target.value)

                                    // Cập nhật state một cách bất biến
                                    setCoursesSelected((prevCourses) =>
                                      prevCourses.map((c) =>
                                        c === course
                                          ? { ...c, discount: newDiscount }
                                          : c
                                      )
                                    )
                                  }}
                                />
                                <div className="grid h-fit place-items-center rounded-full border border-controls-border-border-base p-1">
                                  {isSelected ? (
                                    <div className="grid aspect-square h-4 place-items-center rounded-full bg-[#84CC16] lg:h-[22px]">
                                      <CheckIcon className="h-3 w-3 text-white lg:h-4 lg:w-4" />
                                    </div>
                                  ) : (
                                    <div className="aspect-square h-4 lg:h-[22px]"></div>
                                  )}
                                </div>
                              </>
                            )
                          })()}
                        </div>
                      </div>
                    ))}
                    {data?.pages
                      ?.flatMap((page) => page.payload)
                      ?.filter(
                        (course) =>
                          !coursesSelected.some(
                            (selectCourse) => course.id == selectCourse.id
                          )
                      )
                      ?.map((course) => (
                        <div
                          key={course.id}
                          className="flex cursor-pointer items-center gap-3 rounded-md border border-controls-border-border-base px-3.5 py-2 hover:bg-background-background-mid"
                          onClick={() =>
                            setCoursesSelected((prev) =>
                              prev.some(
                                (selectCourse) => course.id == selectCourse.id
                              )
                                ? prev.filter(
                                    (selectCourse) =>
                                      course.id != selectCourse.id
                                  )
                                : [...prev, course]
                            )
                          }
                        >
                          <Avatar
                            src={generateMediaLink(course.thumbnailFileId)}
                            className="h-9 w-9 shrink-0 border-none lg:h-11 lg:w-11"
                          ></Avatar>
                          <div className="w-full">
                            <div className="text-sm lg:text-base">{`${
                              course.courseName || ''
                            } `}</div>
                            <div className="h-3 text-xs font-medium leading-3 lg:h-5 lg:text-xs lg:leading-5">
                              {course.courseName || ''}
                            </div>
                          </div>
                          <div className="grid h-fit place-items-center rounded-full border border-controls-border-border-base p-1">
                            {coursesSelected.some(
                              (selectCourse) => course.id == selectCourse.id
                            ) ? (
                              <div className="grid aspect-square h-4 place-items-center rounded-full bg-[#84CC16] lg:h-[22px]">
                                <CheckIcon className="h-3 w-3 text-white lg:h-4 lg:w-4" />
                              </div>
                            ) : (
                              <div className="aspect-square h-4 lg:h-[22px]"></div>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button
                  color="primary"
                  onPress={onClose}
                  onClick={() => console.log(coursesSelected)}
                >
                  Action
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </>
  )
}
