'use client'
import UsersTable from '@/app/manage/users/_components/users-table'
import { Heading } from '@/components/common/heading'
import { AccountsIcon } from '@/components/icons/sidebar/accounts-icon'
import { useListUsersQuery } from '@/queries/useUser'
import { Pagination } from '@nextui-org/react'
import { useRouter } from 'next/navigation'
import { useMemo } from 'react'

type Props = {
  searchParams: { page: string }
}

const LIMIT = 10

const MangeUsersPage = ({ searchParams }: Props) => {
  const { page } = searchParams
  const { push } = useRouter()
  const { data: listUser, isLoading } = useListUsersQuery(
    `limit=${LIMIT}&offset=${(Number(page || 1) - 1) * LIMIT}`
  )
  const totalPage = useMemo(
    () => listUser?.pagination?.totalPages,
    [listUser?.pagination?.totalPages]
  )
  return (
    <>
      <Heading icon={<AccountsIcon />} title="Users" />
      <div className="p-5">
        <UsersTable data={listUser?.payload || []} isLoading={isLoading} />
      </div>
      <Pagination
        isCompact
        showControls
        showShadow
        className="mx-auto w-fit mt-1"
        page={Number(page || 1)}
        total={totalPage ?? 1}
        onChange={(e) => push('/manage/users?page=' + e, { scroll: false })}
      />
    </>
  )
}

export default MangeUsersPage
