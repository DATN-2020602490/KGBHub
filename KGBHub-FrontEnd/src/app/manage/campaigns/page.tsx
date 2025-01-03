'use client'
import DeleteCampaignModal from '@/app/manage/campaigns/_components/delete-campaign-modal'
import { Heading } from '@/components/common/heading'
import { FeedbackIcon } from '@/components/icons/feedback-icon'
import { EditIcon } from '@/components/icons/table/edit-icon'
import { generateMediaLink } from '@/lib/utils'
import { Campaign } from '@/models'
import { useCampaigns, useDeleteCampaignMutation } from '@/queries/useCampaigns'
import {
  Button,
  Chip,
  Image,
  Pagination,
  SortDescriptor,
  Spinner,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
  Tooltip,
} from '@nextui-org/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import React, { useMemo } from 'react'
import { toast } from 'react-toastify'

type Props = {
  searchParams: { page: string }
}

const LIMIT = 10

const columns = [
  { name: 'NAME', uid: 'name', sortable: true },
  { name: 'TYPE', uid: 'type', sortable: true },
  { name: 'STATUS', uid: 'status', sortable: true },
  { name: 'ACTIONS', uid: 'actions' },
]

export default function Page({ searchParams }: Props) {
  const { page } = searchParams
  const { push } = useRouter()
  const { data, isLoading } = useCampaigns(
    `?limit=${LIMIT}&offset=${LIMIT * (Number(page || 1) - 1)}`
  )
  const deleteCampaignMutation = useDeleteCampaignMutation()
  const [filterValue, setFilterValue] = React.useState('')

  const [sortDescriptor, setSortDescriptor] = React.useState<SortDescriptor>({
    column: 'age',
    direction: 'ascending',
  })

  const hasSearchFilter = Boolean(filterValue)

  const filteredItems = React.useMemo(() => {
    let filteredUsers = [...(data?.payload || [])]

    if (hasSearchFilter) {
      filteredUsers = filteredUsers.filter((user) =>
        user.name.toLowerCase().includes(filterValue.toLowerCase())
      )
    }

    return filteredUsers
  }, [data, filterValue])

  const totalPage = useMemo(
    () => data?.pagination?.totalPages,
    [data?.pagination?.totalPages]
  )

  const deleteCampaign = async (data: Campaign) => {
    try {
      await deleteCampaignMutation.mutateAsync(data.id)
      toast.success(`Deleted ${data.name} campaign successfully!`)
    } catch (error) {
      toast.error(`Could not delete ${data.name} campaign!`)
    }
  }

  const sortedItems = React.useMemo(() => {
    return [...filteredItems].sort((a: Campaign, b: Campaign) => {
      const first = a[sortDescriptor.column as keyof Campaign] as number
      const second = b[sortDescriptor.column as keyof Campaign] as number
      const cmp = first < second ? -1 : first > second ? 1 : 0

      return sortDescriptor.direction === 'descending' ? -cmp : cmp
    })
  }, [sortDescriptor, filteredItems])

  const renderCell: any = React.useCallback(
    (campaign: Campaign, columnKey: React.Key) => {
      const cellValue = campaign[columnKey as keyof Campaign]

      switch (columnKey) {
        case 'name':
          return (
            <div className="flex gap-2">
              <Image
                fallbackSrc="/images/upload-image-default.png"
                src={generateMediaLink(campaign.coverFileId)}
                alt={campaign.name}
                width={80}
                height={45}
                radius="sm"
                className="object-cover aspect-video w-full !bg-cover !bg-center !bg-no-repeat shrink-0"
              />
              <div>
                <span className="font-semibold">{campaign.name}</span>
                <p className="italic">
                  {campaign.totalUsed}/{campaign.totalVoucher}
                </p>
              </div>
            </div>
          )
        case 'category':
          return (
            <Chip
              variant="faded"
              className="capitalize text-xs rounded-md"
              color="warning"
              size="sm"
            >
              {campaign.active ?? ''}
            </Chip>
          )
        case 'type':
          return <span>{campaign.type}</span>
        case 'status':
          return (
            <Chip
              className="capitalize"
              color={campaign.active ? 'success' : 'warning'}
              size="sm"
              variant="dot"
            >
              {campaign.active ? 'Active' : 'Inactive'}
            </Chip>
          )
        case 'actions':
          return (
            <div className="relative flex items-center gap-x-4">
              <Tooltip content="Edit">
                <span
                  className="text-lg text-default-400 cursor-pointer active:opacity-50"
                  onClick={() => push(`/manage/campaigns/edit/${campaign.id}`)}
                >
                  <EditIcon className="text-warning" />
                </span>
              </Tooltip>
              <DeleteCampaignModal onDelete={() => deleteCampaign(campaign)} />
            </div>
          )
        default:
          return cellValue
      }
    },
    []
  )

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading
          icon={<FeedbackIcon className="size-10" />}
          title="Campaigns"
        />
        <Button as={Link} href="campaigns/create" color="primary">
          Create
        </Button>
      </div>
      <Table
        aria-label="Example table with custom cells, pagination and sorting"
        isHeaderSticky
        bottomContentPlacement="inside"
        sortDescriptor={sortDescriptor}
        topContentPlacement="outside"
        onSortChange={setSortDescriptor}
        className="mt-8"
      >
        <TableHeader columns={columns}>
          {(column) => (
            <TableColumn
              key={column.uid}
              align={column.uid === 'actions' ? 'center' : 'start'}
              allowsSorting={column.sortable}
            >
              {column.name}
            </TableColumn>
          )}
        </TableHeader>
        <TableBody
          emptyContent={'No users found'}
          items={sortedItems}
          isLoading={isLoading}
          loadingContent={<Spinner />}
        >
          {(item: any) => (
            <TableRow key={item.id}>
              {(columnKey: any) => (
                <TableCell>{renderCell(item, columnKey)}</TableCell>
              )}
            </TableRow>
          )}
        </TableBody>
      </Table>
      <Pagination
        initialPage={1}
        className="mx-auto w-fit mt-2"
        page={Number(page || 1)}
        total={totalPage ?? 1}
        onChange={(e) => {
          push('/manage/campaigns?page=' + e, { scroll: false })
        }}
      />
    </>
  )
}
