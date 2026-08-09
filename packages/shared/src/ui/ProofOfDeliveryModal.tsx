import { useState } from 'react';
import { useLocale } from '@/shared/contexts/LocaleContext';
import type { FullOrder } from '@/shared/lib/order';
import { Camera, CheckCircle2, ImagePlus, Navigation, X } from 'lucide-react';

interface ProofOfDeliveryModalProps {
  order: FullOrder;
  onConfirm: (proof: string) => void;
  onClose: () => void;
}

const ProofOfDeliveryModal = ({ order, onConfirm, onClose }: ProofOfDeliveryModalProps) => {
  const { t } = useLocale();
  const [proofType, setProofType] = useState<'photo' | 'signature'>('photo');

  return (
    <>
      <div className="fixed inset-0 z-50 bg-foreground/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className="w-full max-w-md rounded-t-2xl sm:rounded-2xl border border-border bg-card shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border px-5 py-4">
            <div>
              <h2 className="text-lg font-bold text-foreground">{t('Proof of Delivery', 'إثبات التوصيل')}</h2>
              <p className="text-xs text-muted-foreground">{order.orderNumber}</p>
            </div>
            <button
              onClick={onClose}
              className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="px-5 py-5 space-y-4">
            {/* Toggle */}
            <div className="flex rounded-xl border border-border overflow-hidden">
              <button
                onClick={() => setProofType('photo')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${proofType === 'photo' ? 'gradient-gold text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              >
                <Camera className="h-4 w-4 inline-block me-1.5" />
                {t('Photo', 'صورة')}
              </button>
              <button
                onClick={() => setProofType('signature')}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${proofType === 'signature' ? 'gradient-gold text-primary-foreground' : 'text-muted-foreground hover:bg-accent'}`}
              >
                <Navigation className="h-4 w-4 inline-block me-1.5" />
                {t('Signature', 'توقيع')}
              </button>
            </div>

            {/* Upload placeholder */}
            <div className="flex flex-col items-center justify-center h-48 rounded-xl border-2 border-dashed border-border bg-muted/50 cursor-pointer hover:border-primary/40 transition-colors">
              {proofType === 'photo' ? (
                <>
                  <ImagePlus className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">{t('Tap to take photo', 'اضغط لالتقاط صورة')}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{t('or upload from gallery', 'أو ارفع من المعرض')}</p>
                </>
              ) : (
                <>
                  <Navigation className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-sm text-muted-foreground font-medium">{t('Tap to capture signature', 'اضغط لالتقاط التوقيع')}</p>
                  <p className="text-xs text-muted-foreground/60 mt-1">{t('Customer signs here', 'توقيع العميل هنا')}</p>
                </>
              )}
            </div>

            <button
              onClick={() => onConfirm(proofType === 'photo' ? 'photo_uploaded' : 'signature_captured')}
              className="w-full flex items-center justify-center gap-2 rounded-xl gradient-gold py-3 text-sm font-bold text-primary-foreground transition-all hover:opacity-90 active:scale-[0.98]"
            >
              <CheckCircle2 className="h-4 w-4" />
              {t('Confirm Delivery', 'تأكيد التوصيل')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default ProofOfDeliveryModal;









