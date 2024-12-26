import stripeService from '@/services/stripe.service'
import { useMutation } from '@tanstack/react-query'

export const useEstimateMutation = () => {
  return useMutation({
    mutationFn: (body: {
      courseIds: string[]
      tipPercent?: number
      code?: string
    }) => stripeService.estimate(body),
  })
}
