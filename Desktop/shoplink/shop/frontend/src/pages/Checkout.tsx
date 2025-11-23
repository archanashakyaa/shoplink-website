import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../api/api'

interface CartItem {
  id: number
  product_id: number
  quantity: number
  name: string
  price: number
  image_url?: string
  shop_id: number
  shop_name: string
}

interface ShippingAddress {
  full_name: string
  address: string
  city: string
  state: string
  country: string
  zip_code: string
  phone: string
}

const Checkout = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [cartItems, setCartItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal' | 'cash_on_delivery'>('cash_on_delivery')
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    full_name: user?.full_name || '',
    address: '',
    city: '',
    state: '',
    country: '',
    zip_code: '',
    phone: user?.phone || '',
  })
  const [cardDetails, setCardDetails] = useState({
    card_number: '',
    card_name: '',
    expiry_date: '',
    cvv: '',
  })
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    loadCart()
  }, [])

  const loadCart = async () => {
    setLoading(true)
    try {
      const response = await api.getCart()
      if (response.status === 'success' && response.data) {
        setCartItems(response.data)
        if (response.data.length === 0) {
          navigate('/profile')
        }
      }
    } catch (error) {
      console.error('Failed to load cart:', error)
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!shippingAddress.full_name.trim()) {
      newErrors.full_name = 'Full name is required'
    }
    if (!shippingAddress.address.trim()) {
      newErrors.address = 'Address is required'
    }
    if (!shippingAddress.city.trim()) {
      newErrors.city = 'City is required'
    }
    if (!shippingAddress.state.trim()) {
      newErrors.state = 'State is required'
    }
    if (!shippingAddress.country.trim()) {
      newErrors.country = 'Country is required'
    }
    if (!shippingAddress.zip_code.trim()) {
      newErrors.zip_code = 'ZIP code is required'
    }
    if (!shippingAddress.phone.trim()) {
      newErrors.phone = 'Phone number is required'
    }

    if (paymentMethod === 'card') {
      if (!cardDetails.card_number.trim()) {
        newErrors.card_number = 'Card number is required'
      } else if (cardDetails.card_number.replace(/\s/g, '').length < 16) {
        newErrors.card_number = 'Card number must be 16 digits'
      }
      if (!cardDetails.card_name.trim()) {
        newErrors.card_name = 'Cardholder name is required'
      }
      if (!cardDetails.expiry_date.trim()) {
        newErrors.expiry_date = 'Expiry date is required'
      } else if (!/^\d{2}\/\d{2}$/.test(cardDetails.expiry_date)) {
        newErrors.expiry_date = 'Format: MM/YY'
      }
      if (!cardDetails.cvv.trim()) {
        newErrors.cvv = 'CVV is required'
      } else if (cardDetails.cvv.length < 3) {
        newErrors.cvv = 'CVV must be 3-4 digits'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '')
    const matches = v.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }
    if (parts.length) {
      return parts.join(' ')
    } else {
      return v
    }
  }

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value)
    setCardDetails({ ...cardDetails, card_number: formatted })
  }

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '')
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4)
    }
    setCardDetails({ ...cardDetails, expiry_date: value })
  }

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '').substring(0, 4)
    setCardDetails({ ...cardDetails, cvv: value })
  }

  const groupItemsByShop = () => {
    const grouped: Record<number, CartItem[]> = {}
    cartItems.forEach((item) => {
      if (!grouped[item.shop_id]) {
        grouped[item.shop_id] = []
      }
      grouped[item.shop_id].push(item)
    })
    return grouped
  }

  const calculateTotal = (items: CartItem[]) => {
    return items.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const calculateGrandTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0)
  }

  const handlePlaceOrder = async () => {
    if (!validateForm()) {
      return
    }

    setProcessing(true)
    try {
      const groupedItems = groupItemsByShop()
      const orderPromises = Object.entries(groupedItems).map(async ([shopId, items]) => {
        const orderData = {
          shop_id: parseInt(shopId),
          items: items.map((item) => ({
            product_id: item.product_id,
            quantity: item.quantity,
          })),
          payment_method: paymentMethod,
          shipping_address: `${shippingAddress.full_name}\n${shippingAddress.address}\n${shippingAddress.city}, ${shippingAddress.state} ${shippingAddress.zip_code}\n${shippingAddress.country}\nPhone: ${shippingAddress.phone}`,
        }

        return api.createOrder(orderData)
      })

      const results = await Promise.all(orderPromises)
      const allSuccess = results.every((result) => result.status === 'success')

      if (allSuccess) {
        // Clear cart
        await api.clearCart()
        // Navigate to success page or profile
        navigate('/profile?tab=orders&success=true')
      } else {
        alert('Some orders failed to process. Please try again.')
      }
    } catch (error) {
      console.error('Failed to place order:', error)
      alert('Failed to place order. Please try again.')
    } finally {
      setProcessing(false)
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center">Loading...</div>
      </div>
    )
  }

  if (cartItems.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <p className="text-gray-500 text-lg mb-4">Your cart is empty</p>
          <button
            onClick={() => navigate('/shops')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md"
          >
            Start Shopping
          </button>
        </div>
      </div>
    )
  }

  const groupedItems = groupItemsByShop()

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Forms */}
        <div className="lg:col-span-2 space-y-6">
          {/* Shipping Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  value={shippingAddress.full_name}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, full_name: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.full_name ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.full_name && (
                  <p className="text-red-500 text-xs mt-1">{errors.full_name}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Address *
                </label>
                <input
                  type="text"
                  value={shippingAddress.address}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, address: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.address && (
                  <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">City *</label>
                  <input
                    type="text"
                    value={shippingAddress.city}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, city: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">State *</label>
                  <input
                    type="text"
                    value={shippingAddress.state}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, state: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.state ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.state && <p className="text-red-500 text-xs mt-1">{errors.state}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    ZIP Code *
                  </label>
                  <input
                    type="text"
                    value={shippingAddress.zip_code}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, zip_code: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.zip_code ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.zip_code && (
                    <p className="text-red-500 text-xs mt-1">{errors.zip_code}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Country *</label>
                  <input
                    type="text"
                    value={shippingAddress.country}
                    onChange={(e) =>
                      setShippingAddress({ ...shippingAddress, country: e.target.value })
                    }
                    className={`w-full px-3 py-2 border rounded-md ${
                      errors.country ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {errors.country && (
                    <p className="text-red-500 text-xs mt-1">{errors.country}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  type="tel"
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, phone: e.target.value })
                  }
                  className={`w-full px-3 py-2 border rounded-md ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
            <div className="space-y-4">
              {/* Cash on Delivery */}
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="cash_on_delivery"
                  checked={paymentMethod === 'cash_on_delivery'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-semibold">💰 Cash on Delivery</div>
                  <div className="text-sm text-gray-500">Pay when you receive your order</div>
                </div>
              </label>

              {/* Credit/Debit Card */}
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === 'card'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-semibold">💳 Credit/Debit Card</div>
                  <div className="text-sm text-gray-500">Visa, Mastercard, etc.</div>
                </div>
              </label>

              {/* PayPal */}
              <label className="flex items-center p-4 border-2 rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="payment"
                  value="paypal"
                  checked={paymentMethod === 'paypal'}
                  onChange={(e) => setPaymentMethod(e.target.value as any)}
                  className="mr-3"
                />
                <div className="flex-1">
                  <div className="font-semibold">🅿️ PayPal</div>
                  <div className="text-sm text-gray-500">Pay securely with PayPal</div>
                </div>
              </label>

              {/* Card Details Form */}
              {paymentMethod === 'card' && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Card Number *
                    </label>
                    <input
                      type="text"
                      placeholder="1234 5678 9012 3456"
                      value={cardDetails.card_number}
                      onChange={handleCardNumberChange}
                      maxLength={19}
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors.card_number ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.card_number && (
                      <p className="text-red-500 text-xs mt-1">{errors.card_number}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cardholder Name *
                    </label>
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={cardDetails.card_name}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, card_name: e.target.value })
                      }
                      className={`w-full px-3 py-2 border rounded-md ${
                        errors.card_name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.card_name && (
                      <p className="text-red-500 text-xs mt-1">{errors.card_name}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Expiry Date *
                      </label>
                      <input
                        type="text"
                        placeholder="MM/YY"
                        value={cardDetails.expiry_date}
                        onChange={handleExpiryChange}
                        maxLength={5}
                        className={`w-full px-3 py-2 border rounded-md ${
                          errors.expiry_date ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.expiry_date && (
                        <p className="text-red-500 text-xs mt-1">{errors.expiry_date}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">CVV *</label>
                      <input
                        type="text"
                        placeholder="123"
                        value={cardDetails.cvv}
                        onChange={handleCvvChange}
                        maxLength={4}
                        className={`w-full px-3 py-2 border rounded-md ${
                          errors.cvv ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.cvv && <p className="text-red-500 text-xs mt-1">{errors.cvv}</p>}
                    </div>
                  </div>
                </div>
              )}

              {paymentMethod === 'paypal' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    You will be redirected to PayPal to complete your payment.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Order Summary */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow p-6 sticky top-4">
            <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

            <div className="space-y-4 mb-6">
              {Object.entries(groupedItems).map(([shopId, items]) => (
                <div key={shopId} className="border-b pb-4">
                  <p className="font-semibold text-sm text-gray-500 mb-2">
                    {items[0].shop_name}
                  </p>
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm mb-2">
                      <span className="text-gray-600">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="font-medium">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  ))}
                  <div className="flex justify-between font-semibold mt-2">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(calculateTotal(items))}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between text-lg font-bold mb-4">
                <span>Total:</span>
                <span className="text-blue-600">{formatCurrency(calculateGrandTotal())}</span>
              </div>

              <button
                onClick={handlePlaceOrder}
                disabled={processing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {processing ? 'Processing...' : 'Place Order'}
              </button>

              <button
                onClick={() => navigate('/profile')}
                className="w-full mt-2 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-2 rounded-md text-sm"
              >
                Back to Cart
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Checkout





