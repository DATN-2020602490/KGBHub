'use client'
import CampaignEditionForm from '@/app/manage/campaigns/_components/campaign-edition-form'
import { useCampaign } from '@/queries/useCampaigns'

type Props = {
  params: { campaignId: string }
}

export default function Page({ params }: Props) {
  const { campaignId } = params
  const { data, isLoading } = useCampaign(campaignId)

  console.log(data)

  return <div>{data && <CampaignEditionForm data={data?.payload} />}</div>
}
