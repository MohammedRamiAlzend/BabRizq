import { X, Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { useCart } from '@/features/cart/model/cartContext';
import { useLocale } from '@/shared/contexts/LocaleContext';

interface CartDrawerProps {
  open: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

const CartDrawer = ({ open, onClose, onCheckout }: CartDrawerProps) => {
  const { items, removeItem, updateQuantity, totalPrice, totalItems } = useCart();
  const { t } = useLocale();

  return (
    <>
      {/* Overlay */}
      <div
        className={`fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`fixed inset-y-0 end-0 z-50 w-full max-w-md bg-card border-s border-border shadow-2xl transition-transform duration-300 ease-out flex flex-col ${open ? 'translate-x-0 rtl:-translate-x-0' : 'translate-x-full rtl:-translate-x-full'}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {t('Your Cart', 'سلة التسوق')}
              {totalItems > 0 && <span className="text-muted-foreground font-normal text-sm ms-1">({totalItems})</span>}
            </h2>
          </div>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <ShoppingBag className="h-16 w-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">{t('Your cart is empty', 'سلة التسوق فارغة')}</p>
              <p className="text-sm text-muted-foreground/70 mt-1">{t('Start adding some products!', 'ابدأ بإضافة بعض المنتجات!')}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map(({ product, quantity }) => (
                <div key={product.id} className="flex gap-3 rounded-xl border border-border bg-background p-3">
                  <img
                    src={product.image}
                    alt={t(product.nameEn, product.nameAr)}
                    className="h-20 w-20 rounded-lg object-cover shrink-0"
                  />
                  <div className="flex flex-1 flex-col min-w-0">
                    <h4 className="text-sm font-semibold text-foreground truncate">{t(product.nameEn, product.nameAr)}</h4>
                    <p className="text-xs text-muted-foreground">{product.price} {t('SAR', 'ر.س')}</p>

                    <div className="mt-auto flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => updateQuantity(product.id, quantity - 1)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent transition-colors"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="text-sm font-medium text-foreground w-6 text-center">{quantity}</span>
                        <button
                          onClick={() => updateQuantity(product.id, quantity + 1)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-border text-muted-foreground hover:bg-accent transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <button onClick={() => removeItem(product.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-border px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{t('Total', 'المجموع')}</span>
              <span className="text-xl font-bold text-foreground">{totalPrice} <span className="text-sm font-normal text-muted-foreground">{t('SAR', 'ر.س')}</span></span>
            </div>
            <button
              onClick={onCheckout}
              className="w-full rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
            >
              {t('Proceed to Checkout', 'المتابعة للدفع')}
            </button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartDrawer;









