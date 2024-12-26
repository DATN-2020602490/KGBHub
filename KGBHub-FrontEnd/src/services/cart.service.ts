import http from '@/lib/http'
import { Cart } from '@/models'

export const cartApiRequest = {
  get: () =>
    http.get<Cart>('-public/carts', {
      cache: 'no-store',
    }),

  add: (courseId: string) =>
    http.post('-public/carts/actions/add', { courseId }),

  remove: (courseIds: string[]) =>
    http.post('-public/carts/actions/remove', { courseIds }),

  clear: () => http.post('-public/carts/actions/clear', {}),

  checkout: (body: {
    courseIds: string[]
    successUrl?: string
    code?: string
  }) => http.post('/stripe/checkout-from-cart', { ...body, tipPercent: 0 }),
}
