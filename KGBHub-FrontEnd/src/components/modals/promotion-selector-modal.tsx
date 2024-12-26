'use client'

import { VoucherType } from '@/constants'
import { generateMediaLink } from '@/lib/utils'
import { useMyPromotions } from '@/queries/useCampaigns'
import {
  Button,
  Image,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  useDisclosure,
} from '@nextui-org/react'
import { CheckIcon } from 'lucide-react'

const PromotionSelectorModal = ({
  promotionSelected,
  setPromotionSelected,
}: any) => {
  const { data } = useMyPromotions()
  const myPromotions = data?.payload
  const { isOpen, onOpen, onOpenChange } = useDisclosure()

  return (
    <div className="flex flex-col gap-2">
      <Button onPress={onOpen} className="w-full">
        {promotionSelected
          ? promotionSelected?.vouchers?.[0]?.code
          : 'Select voucher'}
      </Button>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">
                My Voucher
              </ModalHeader>
              <ModalBody className="max-h-[70vh] overflow-y-auto">
                <div className="space-y-2.5">
                  {myPromotions?.map((promotion) => (
                    <div
                      key={promotion.id}
                      className={`p-2 rounded-md border cursor-pointer gap-x-4 flex items-center justify-between`}
                      onClick={() => setPromotionSelected(promotion)}
                    >
                      <div className="flex gap-x-4">
                        <Image
                          src={generateMediaLink(
                            promotion.campaign.coverFileId ?? ''
                          )}
                          alt={promotion.campaign.name}
                          width={200}
                          height={200}
                          className="object-cover aspect-video w-32"
                        />
                        <div>
                          <div className="flex items-center gap-x-1">
                            <p className="text-semibold w-fit">
                              {promotion.campaign.name}
                            </p>
                            <span className="text-xs px-3 py-1 text-white bg-destructive rounded-md">
                              -
                              {promotion?.vouchers?.[0]?.type ===
                              VoucherType.FEE_PERCENTAGE
                                ? `${promotion.campaign.feeVoucherValue}% fee`
                                : `${promotion.campaign.productVoucherValue}% product price`}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-default-400 line-clamp-3">
                            {promotion.campaign.description}
                          </p>
                        </div>
                      </div>
                      <div className="grid h-fit place-items-center rounded-full border border-controls-border-border-base p-1 mr-4">
                        {promotionSelected?.id === promotion.id ? (
                          <div className="grid aspect-square h-4 place-items-center rounded-full bg-[#84CC16] lg:h-[22px]">
                            <CheckIcon className="h-3 w-3 text-white lg:h-4 lg:w-4" />
                          </div>
                        ) : (
                          <div className="aspect-square h-4 lg:h-[22px]"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="light" onPress={onClose}>
                  Close
                </Button>
                <Button color="primary" onPress={onClose}>
                  Continue
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>
    </div>
  )
}

export default PromotionSelectorModal
