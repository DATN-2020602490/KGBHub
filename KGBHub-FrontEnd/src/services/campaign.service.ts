import http from '@/lib/http'
import { Campaign, Voucher } from '@/models'

const campaignService = {
  get: (id: string) => http.get<Campaign>(`/campaigns/${id}`),
  getList: (params?: any) => {
    return http.get<Campaign[]>('/campaigns' + (params || ""))
  },
  create: (body: any) => http.post('/campaigns', body),
  edit: (id: string, body: any) => http.patch(`/campaigns/${id}`, body),
  delete: (id: string) => http.delete(`/campaigns/${id}`),
  join: (body: { campaignId: string }) =>
    http.post('/campaigns/actions/join-campaign', body),
  getMyPromotion: () =>
    http.get<{ id: string; campaign: Campaign; vouchers: Voucher[] }[]>(
      '/campaigns/actions/my-promotion'
    ),
}

export default campaignService
