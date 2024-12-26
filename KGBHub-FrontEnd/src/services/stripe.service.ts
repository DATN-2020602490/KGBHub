import http from '@/lib/http'

const stripeService = {
  estimate: (body: {
    courseIds: string[]
    tipPercent?: number
    code?: string
  }) => http.post('/stripe/estimate', body),
}

export default stripeService
