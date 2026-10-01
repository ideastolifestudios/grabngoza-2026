// Initialize Yoco SDK
const yoco = new window.YocoSDK({
  publicKey: process.env.NEXT_PUBLIC_YOCO_PUBLIC_KEY // e.g., 'pk_test_...'
});

const handleCheckout = (cartTotalInRands) => {
  const amountInCents = Math.round(cartTotalInRands * 100);

  yoco.showPopup({
    amountInCents: amountInCents,
    currency: 'ZAR',
    name: 'Shop Grab N Go',
    description: 'Order Payment',
    callback: async (result) => {
      // 1. Check for SDK inline errors
      if (result.error) {
        console.error('Yoco SDK Error:', result.error.message);
        return;
      }

      // 2. Pass result.id ('tok_xxxxxxxx') to your backend
      try {
        const response = await fetch('/api/payments?action=yoco', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            token: result.id,
            amountInCents: amountInCents,
            currency: 'ZAR',
          }),
        });

        const paymentData = await response.json();

        if (!response.ok) {
          throw new Error(paymentData.error || 'Payment processing failed');
        }

        // 3. Payment succeeded -> Redirect to order success page
        window.location.href = `/order-success?id=${paymentData.id}`;
      } catch (err) {
        console.error('Backend Payment Error:', err.message);
      }
    },
  });
};

export default handleCheckout;
