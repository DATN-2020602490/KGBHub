'use client'
import { Heading } from '@/components/common/heading'
import PromotionSelectorModal from '@/components/modals/promotion-selector-modal'
import { useCart } from '@/contexts/cart'
import { formatNumberWithCommas, generateMediaLink } from '@/lib/utils'
import { useEstimateMutation } from '@/queries'
import {
  useClearMutation,
  useMyCart,
  useRemoveToCartMutation,
} from '@/queries/useCart'
import { cartApiRequest } from '@/services/cart.service'
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@nextui-org/react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { toast } from 'react-toastify'

const CartCheckoutPage = () => {
  const { replace } = useRouter()
  const [isLoading, setIsLoading] = useState(true)
  const { fetchCart, cart } = useCart()
  const [selectedKeys, setSelectedKeys] = useState<any>(new Set([]))
  const [promotionSelected, setPromotionSelected] = useState<any>()
  const [estimate, setEstimate] = useState<any>()
  const { data: cartData } = useMyCart()
  const removeToCartMutation = useRemoveToCartMutation()
  const clearMutation = useClearMutation()
  const estimateMutation = useEstimateMutation()
  const totalPriceOriginal =
    (selectedKeys === 'all'
      ? cart?.coursesOnCarts?.reduce(
          (acc: number, course: any) => acc + course?.course?.priceAmount,
          0
        )
      : cart?.coursesOnCarts
          ?.filter((item: any) => [...selectedKeys]?.includes(item.courseId))
          ?.reduce(
            (acc: number, course: any) => acc + course?.course?.priceAmount,
            0
          )) || 0
  const removeItem = async (courseIds: string[]) => {
    try {
      await removeToCartMutation.mutateAsync(courseIds)
      fetchCart()
    } catch (error) {
      console.log(error)
    }
  }
  const clearCartHandler = async () => {
    try {
      await clearMutation.mutateAsync()
      fetchCart()
    } catch (error) {
      console.log(error)
    }
  }
  const checkoutCart = async () => {
    try {
      setIsLoading(true)
      const courseIds: string[] =
        (selectedKeys === 'all'
          ? cart?.coursesOnCarts?.map((course: any) => course.courseId)
          : [...selectedKeys]) || []
      const res = await cartApiRequest.checkout({
        courseIds,
        successUrl: 'https://kgb-hub.harmoury.space/',
        code: promotionSelected?.vouchers?.[0]?.code,
      })
      if (res.status === 200) {
        if ((res.payload as { checkoutUrl: string }).checkoutUrl) {
          window.location.href = (
            res.payload as { checkoutUrl: string }
          ).checkoutUrl
        } else {
          toast.success('Buy course successfully')
        }
      }
    } catch (error) {
    } finally {
      setIsLoading(false)
    }
  }
  const estimateHandler = async () => {
    const courseIds =
      (selectedKeys === 'all'
        ? cart?.coursesOnCarts?.map((course: any) => course.courseId)
        : [...selectedKeys]) || []
    if (courseIds.length <= 0) return
    try {
      const res = await estimateMutation.mutateAsync({
        courseIds,
        code: promotionSelected?.vouchers?.[0]?.code,
      })
      setEstimate(res.payload)
    } catch (error) {}
  }
  useEffect(() => {
    estimateHandler()
  }, [JSON.stringify(selectedKeys), promotionSelected?.campaign?.id])

  if (!cart) {
    return
  }
  if (cart?.coursesOnCarts.length <= 0) {
    replace('/')
    return
  }
  const rows =
    cart?.coursesOnCarts.length > 0
      ? cart?.coursesOnCarts?.map((course: any) => ({
          key: course?.coureseId,
          name: (
            <Link
              href={'/course/' + course?.courseId}
              className="flex items-center gap-2 w-fit"
            >
              <Image
                src={generateMediaLink(course?.course?.thumbnail ?? '')}
                alt={course?.course?.courseName}
                width={400}
                height={400}
                className="object-cover w-14"
              />
              <span className="line-clamp-2">{course?.course?.courseName}</span>
            </Link>
          ),
          price: '$' + course?.course?.priceAmount,
          action: <Button size="sm" color="danger"></Button>,
        }))
      : []

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Heading title="My cart" />
          <Button onClick={clearCartHandler} color="danger">
            Clear cart
          </Button>
        </div>
        <Table
          // sortDescriptor={list.sortDescriptor}
          color={'primary'}
          selectionMode="multiple"
          defaultSelectedKeys={['2', '3']}
          aria-label="Example static collection table"
          selectedKeys={selectedKeys}
          onSelectionChange={setSelectedKeys}
        >
          <TableHeader>
            <TableColumn key="courseName">COURSE</TableColumn>
            <TableColumn key="priceAmount">PRICE</TableColumn>
            <TableColumn key="cartAction">ACTIONS</TableColumn>
          </TableHeader>
          <TableBody items={rows}>
            {cart?.coursesOnCarts?.length > 0 ? (
              cart?.coursesOnCarts.map((course: any) => (
                <TableRow key={course?.courseId}>
                  <TableCell className="">
                    <Link
                      href={'/course/' + course?.courseId}
                      className="flex items-center gap-2 w-fit"
                    >
                      <Image
                        src={generateMediaLink(
                          course?.course?.thumbnailFileId ?? ''
                        )}
                        alt={course?.course?.courseName}
                        width={400}
                        height={400}
                        className="object-cover w-14"
                      />
                      <span className="line-clamp-2">
                        {course?.course?.courseName}
                      </span>
                    </Link>
                  </TableCell>
                  <TableCell>{'$' + course?.course?.priceAmount}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      color="danger"
                      onClick={() => removeItem([course?.courseId])}
                    >
                      Remove
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <></>
            )}
          </TableBody>
        </Table>
      </div>
      <PromotionSelectorModal
        promotionSelected={promotionSelected}
        setPromotionSelected={setPromotionSelected}
      />
      <div className="text-end w-1/4 ml-auto">
        <div>
          <span>Original amount:</span>
          <span className="ml-2">
            {formatNumberWithCommas(totalPriceOriginal ?? 0)}$
          </span>
        </div>
        <div>
          <span>Fee stripe:</span>
          <span className="ml-2">
            {formatNumberWithCommas(estimate?.originalFee ?? 0)}$
          </span>
        </div>
        {!!estimate?.voucherAmount && (
          <div>
            <span>Voucher amount:</span>{' '}
            <span className="text-destructive ml-2">
              {formatNumberWithCommas(estimate.voucherAmount ?? 0)}$
            </span>
          </div>
        )}
        {!!estimate?.discountAmount && (
          <div>
            <span>Discount amount:</span>
            <span className="text-destructive ml-2">
              {formatNumberWithCommas(estimate.discountAmount ?? 0)}$
            </span>
          </div>
        )}
        <div>
          <span>Total:</span>
          <span className="text-green-600 ml-2">
            {formatNumberWithCommas(
              (estimate?.amount ?? 0) + (estimate?.fee ?? 0) <= 0
                ? 0
                : (estimate?.amount ?? 0) + (estimate?.fee ?? 0)
            )}
            $
          </span>
        </div>
      </div>
      <div className="w-1/6 ml-auto">
        <Button className="w-full" color="primary" onClick={checkoutCart}>
          Pay now
        </Button>
      </div>
    </div>
  )
}

export default CartCheckoutPage
