'use client'

import { useAccountContext } from '@/contexts/account'
import { cartApiRequest } from '@/services/cart.service'
import { createContext, useContext, useEffect, useState } from 'react'

type CartContextType = {
  cart: any
  setCart: (cart: any) => void
  fetchCart: () => void
}

const CartContext = createContext<CartContextType>({
  cart: [],
  setCart: () => {},
  fetchCart: () => {},
})
function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAccountContext()
  const [cart, setCart] = useState<any>()
  useEffect(() => {
    if (user?.email) fetchCart()
  }, [setCart, user?.email])
  const fetchCart = async () => {
    const res = await cartApiRequest.get()
    if (res.status === 200) setCart(res.payload)
  }
  return (
    <CartContext.Provider value={{ cart, setCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  )
}

function useCart() {
  const context = useContext(CartContext)
  if (typeof context === 'undefined')
    throw new Error('useDropdown must be used within AlertProvider')
  return context
}
export { useCart, CartProvider }
