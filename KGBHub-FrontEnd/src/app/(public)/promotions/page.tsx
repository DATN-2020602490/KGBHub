"use client";
import { Heading } from "@/components/common/heading";
import { generateMediaLink } from "@/lib/utils";
import { useCampaigns, useJoinCampaignMutation } from "@/queries/useCampaigns";
import { Button, Pagination } from "@nextui-org/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useMemo } from "react";
import { toast } from "react-toastify";

type Props = {
  searchParams: { page: string }
}

const LIMIT = 12

export default function PromotionsPage({ searchParams }: Props) {
  const { page } = searchParams
  const { data, isLoading } = useCampaigns(`?active=true&limit=${LIMIT}&offset=${LIMIT * (Number(page || 1) - 1)}`);
  const joinCampaignMutation = useJoinCampaignMutation();
    const { push } = useRouter()
  const claimPromotion = async (campaignId: string) => {
    try {
      await joinCampaignMutation.mutateAsync(campaignId);
      toast.success("Claimed promotion successfully!");
    } catch (error) {
      console.log(error);
      toast.error("Could not claim promotion!");
    }
  };
    const totalPage = useMemo(
      () => data?.pagination?.totalPages,
      [data?.pagination?.totalPages]
    )
  return (
    <>
      <Heading title="Promotions" className="mb-6" />
      <div className="mb-8 text-sm">
        <p>
          Unlock exclusive deals and promotions tailored just for you! Discover
          a variety of exciting offers designed to save you money while bringing
          you the best value for your purchases. These promotions are available
          for a limited time, so don’t miss out on the chance to maximize your
          savings.
        </p>
        <Image
          src="/images/get-promotion-banner-3.webp"
          alt="Promotion"
          width={768}
          height={500}
          className="aspect-[21/9] object-cover w-[768px] mx-auto rounded-md my-6"
        />
        <p>
          Claiming your promotion is quick and easy. Follow the steps below to
          unlock discounts, rewards, or special gifts. With just a few clicks,
          you can enjoy benefits that elevate your shopping experience. Act
          fast—quantities are limited, and the clock is ticking. Don’t wait
          until it’s too late! Make sure you secure your spot and take advantage
          of these incredible deals today. Click the button below to start the
          process and make the most of these time-sensitive promotions!
        </p>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {isLoading ? (
          <div>Loading...</div>
        ) : (
          data?.payload.map((campaign) => (
            // <div key={campaign.id}>
            //   <Image
            //     src={generateMediaLink(campaign.coverFileId ?? '')}
            //     alt={campaign.name}
            //     className="object-cover rounded-md aspect-video"
            //   />
            //   <div>{campaign.name}</div>
            //   <Button
            //     onClick={() => claimPromotion(campaign.id)}
            //     color={campaign.isJoined ? 'default' : 'primary'}
            //     className="w-full"
            //     disabled={campaign.isJoined}
            //   >
            //     {campaign.isJoined ? 'Claimed' : 'Claim'}
            //   </Button>
            // </div>
            <div
              key={campaign.id}
              className="flex flex-col w-60  h-80 overflow-hidden mx-auto mt-8 rounded-lg"
            >
              <div className="bg-blue-300 rounded- h-2/3 relative border-b-2 border-gray-500 border-dashed flex items-center justify-center px-4">
                <div>
                  <Image
                    src={generateMediaLink(campaign.coverFileId ?? "")}
                    alt={campaign.name}
                    width={400}
                    height={300}
                    className="object-cover rounded-md aspect-video mb-2.5"
                  />
                  <div className="text-slate-800 font-semibold text-center">
                    {campaign.name}
                  </div>
                </div>

                <span className="absolute bg-background size-10 rounded-full bottom-0 translate-y-1/2 -translate-x-1/2 left-0"></span>
                <span className="absolute bg-background size-10 rounded-full bottom-0 translate-y-1/2 translate-x-1/2 right-0"></span>
              </div>
              <div className="flex-1 flex justify-center items-center bg-blue-300">
                <Button
                  onClick={() => claimPromotion(campaign.id)}
                  color={campaign.isJoined ? "default" : "primary"}
                  className="px-8 disabled:opacity-75"
                  disabled={campaign.isJoined}
                >
                  {campaign.isJoined ? "Claimed" : "Claim"}
                </Button>
              </div>
            </div>
          ))
        )}
      </div>
      <Pagination
        initialPage={1}
        className="mx-auto w-fit mt-2"
        page={Number(page || 1)}
        total={totalPage ?? 1}
        onChange={(e) => {
          push('/promotions?page=' + e, { scroll: false })
        }}
      />
    </>
  );
}
