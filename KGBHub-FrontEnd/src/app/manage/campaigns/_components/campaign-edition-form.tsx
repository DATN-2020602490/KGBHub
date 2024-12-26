'use client'
import FileUpload from '@/components/input/file-upload'
import { convertObjectToFormData } from '@/lib/utils'
import { useUpdateCampaignMutation } from '@/queries/useCampaigns'
import { zodResolver } from '@hookform/resolvers/zod'
import { Button, Input, Spinner, Textarea } from '@nextui-org/react'
import { CalendarDays, X } from 'lucide-react'
import { useRouter } from 'next/navigation'
import DatePicker from 'react-date-picker'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'react-toastify'
import { z } from 'zod'

const schema = z.object({
  name: z.string().min(3),
  description: z.string().min(3),
  cover: z.any(),
  startAt: z.any(),
  endAt: z.any(),
})

export default function CampaignEditionForm({ data }: { data: any }) {
  const router = useRouter()

  const updateCampaignMutation = useUpdateCampaignMutation()
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: data?.name ?? '',
      description: data?.description ?? '',

      cover: data?.coverFileId ?? '',
      startAt: data?.startAt ?? '',
      endAt: data?.endAt ?? '',
    },
  })
  const submit = async (values: any) => {
    const formData = convertObjectToFormData(values)
    try {
      await updateCampaignMutation.mutateAsync({
        id: data.id,
        payload: formData,
      })
      toast.success('Update campaign successfully!')
      router.push('/manage/campaigns')
    } catch (error) {
      console.log(error)
      toast.warning('Cannot update this campaign. Please try again!')
    }
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

      <Button
        className="flex items-center ml-auto"
        color="primary"
        type="submit"
        disabled={updateCampaignMutation.isPending}
      >
        {updateCampaignMutation.isPending ? (
          <Spinner color="success" />
        ) : (
          'Save'
        )}
      </Button>
    </form>
  )
}
