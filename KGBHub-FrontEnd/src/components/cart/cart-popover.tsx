'use client'
import Empty from '@/components/common/empty'
import CartIcon from '@/components/icons/cart-icon'
import { useCart } from '@/contexts/cart'
import { generateMediaLink } from '@/lib/utils'
import { useMyCart } from '@/queries/useCart'
import {
  Badge,
  Button,
  Image,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@nextui-org/react'
import Link from 'next/link'

const CartPopover = () => {
  const { cart } = useCart()
  const { data, isLoading } = useMyCart()
  const myCart = data?.payload
  return (
    <Popover placement="bottom" showArrow shouldBlockScroll>
      <Badge
        color="danger"
        content={cart?.coursesOnCarts?.length}
        isInvisible={!cart?.coursesOnCarts?.length}
        shape="circle"
      >
        <PopoverTrigger>
          <span>
            <CartIcon className="cursor-pointer size-6" />
          </span>
        </PopoverTrigger>
      </Badge>
      <PopoverContent className="p-4">
        <h3 className="text-lg font-semibold mb-2">My cart</h3>
        {!!cart?.coursesOnCarts?.length && cart?.coursesOnCarts?.length > 0 ? (
          <div className="max-w-sm space-y-4">
            {cart?.coursesOnCarts.map((course: any) => (
              <Link
                href={`/course/${course.courseId}`}
                key={course.courseId}
                className="flex justify-between"
              >
                <div className="flex gap-2 w-4/5">
                  <Image
                    src={generateMediaLink(course.course.thumbnailFileId ?? '')}
                    alt={course.course.courseName}
                    width={400}
                    height={400}
                    className="object-cover w-14"
                  />
                  <span className="line-clamp-2">
                    {course.course.courseName}
                  </span>
                </div>
                <span className="text-green-500">
                  {'$' + course.course.priceAmount}
                </span>
              </Link>
            ))}
            <div className="flex justify-between items-center">
              <div className="space-x-2">
                <span>Total:</span>
                <span>{cart?.coursesOnCarts.length}</span>
              </div>
              <Button
                as={Link}
                color="secondary"
                href="/cart-checkout"
                size="sm"
              >
                Go to Cart checkout
              </Button>
            </div>
          </div>
        ) : (
          <Empty />
        )}
      </PopoverContent>
    </Popover>
  )
}

export default CartPopover
