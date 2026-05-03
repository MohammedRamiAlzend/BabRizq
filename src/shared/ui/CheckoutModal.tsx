import { useState } from 'react';
import { ArrowRight, ArrowLeft, CheckCircle2, Package } from 'lucide-react';
import { useCart } from '@/features/cart/model/cartContext';
import { useLocale } from '@/shared/contexts/LocaleContext';

interface CheckoutModalProps {
  open: boolean;
  onClose: () => void;
}

const CheckoutModal = ({ open, onClose }: CheckoutModalProps) => {
  const { items, totalPrice, clearCart } = useCart();
  const { t, dir } = useLocale();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [placed, setPlaced] = useState(false);

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPlaced(true);
    clearCart();
  };

  const handleClose = () => {
    setPlaced(false);
    setName('');
    setPhone('');
    setAddress('');
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={handleClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
          {placed ? (
            /* Success state */
            <div className="flex flex-col items-center justify-center p-10 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10 mb-5">
                <CheckCircle2 className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-2xl font-bold text-foreground mb-2">
                {t('Order Placed!', 'تم تقديم الطلب!')}
              </h2>
              <p className="text-muted-foreground mb-6 max-w-xs">
                {t(
                  'Thank you for your order. You will receive a confirmation shortly.',
                  'شكراً لطلبك. ستتلقى تأكيداً قريباً.'
                )}
              </p>
              <button
                onClick={handleClose}
                className="rounded-xl gradient-gold px-8 py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90"
              >
                {t('Continue Shopping', 'متابعة التسوق')}
              </button>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="border-b border-border px-6 py-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold text-foreground">{t('Checkout', 'إتمام الطلب')}</h2>
              </div>

              {/* Order summary */}
              <div className="px-6 py-4 border-b border-border bg-muted/50">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">{t('Items', 'المنتجات')}</span>
                  <span className="text-sm text-foreground">{items.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-foreground">{t('Total', 'المجموع')}</span>
                  <span className="text-lg font-bold text-foreground">{totalPrice} {t('SAR', 'ر.س')}</span>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t('Full Name', 'الاسم الكامل')}</label>
                  <input
                    required
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder={t('Enter your name', 'أدخل اسمك')}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t('Phone Number', 'رقم الهاتف')}</label>
                  <input
                    required
                    type="tel"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder={t('+966 5XX XXX XXXX', '+966 5XX XXX XXXX')}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{t('Delivery Address', 'عنوان التوصيل')}</label>
                  <textarea
                    required
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    rows={3}
                    placeholder={t('Enter your full delivery address', 'أدخل عنوان التوصيل الكامل')}
                    className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>
                <button
                  type="submit"
                  disabled={items.length === 0}
                  className="w-full flex items-center justify-center gap-2 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                >
                  {t('Place Order', 'تأكيد الطلب')}
                  <ArrowIcon className="h-4 w-4" />
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default CheckoutModal;









