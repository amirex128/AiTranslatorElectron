import React, { useEffect } from 'react';

interface OpenRouterGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OpenRouterGuideModal: React.FC<OpenRouterGuideModalProps> = ({
  isOpen,
  onClose,
}) => {
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  const copyToClipboard = async (text: string) => {
    // Use IPC method (Electron's clipboard API) which doesn't require permissions
    if (typeof window !== 'undefined' && window.electronAPI) {
      try {
        await window.electronAPI.writeClipboard(text);
        // Could show a toast here
      } catch (error) {
        console.error('Error copying to clipboard:', error);
        // Fallback to browser API
        if (navigator.clipboard) {
          try {
            await navigator.clipboard.writeText(text);
          } catch (browserError) {
            console.error('Error copying to clipboard via browser API:', browserError);
          }
        }
      }
    } else if (navigator.clipboard) {
      // Fallback to browser API if IPC is not available
      try {
        await navigator.clipboard.writeText(text);
      } catch (error) {
        console.error('Error copying to clipboard:', error);
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 dark:bg-opacity-70 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] m-4 bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col animate-slideUp overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              راهنمای ساخت API Key برای OpenRouter
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              آموزش کامل ساخت و استفاده از API Key در OpenRouter
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            aria-label="بستن"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Introduction */}
          <section>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <p className="text-gray-700 dark:text-gray-300">
                <strong>OpenRouter</strong> یک رابط یکپارچه برای دسترسی به بیش از 300 مدل هوش مصنوعی از ارائه‌دهندگان مختلف است. 
                با استفاده از OpenRouter می‌توانید به مدل‌های مختلف از جمله GPT-4، Claude، Gemini و بسیاری دیگر دسترسی داشته باشید.
              </p>
            </div>
          </section>

          {/* Step 1: Sign Up */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ml-2">
                1
              </span>
              ساخت حساب کاربری
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                برای شروع، باید یک حساب کاربری در OpenRouter ایجاد کنید:
              </p>
              <div className="space-y-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-2">مراحل:</p>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mr-4">
                    <li>به وب‌سایت OpenRouter بروید</li>
                    <li>روی دکمه "Sign up" کلیک کنید</li>
                    <li>می‌توانید با Google، GitHub یا MetaMask ثبت‌نام کنید</li>
                    <li>پس از ثبت‌نام، می‌توانید برای تیم خود یک سازمان (Organization) ایجاد کنید</li>
                  </ol>
                </div>
                <div className="mt-4">
                  <a
                    href="https://openrouter.ai/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300 underline font-medium"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    باز کردن OpenRouter
                  </a>
                </div>
              </div>
            </div>
          </section>

          {/* Step 2: Buy Credits */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ml-2">
                2
              </span>
              خرید اعتبار (Credits)
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                برای استفاده از مدل‌های OpenRouter، باید اعتبار خریداری کنید:
              </p>
              <div className="space-y-2">
                <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mr-4">
                  <li>اعتبارات را می‌توانید با هر مدل یا ارائه‌دهنده استفاده کنید</li>
                  <li>هزینه‌ها بر اساس استفاده واقعی محاسبه می‌شوند</li>
                  <li>می‌توانید اعتبارات را به صورت ماهانه یا یک‌باره خریداری کنید</li>
                  <li>OpenRouter قیمت‌های بهتری نسبت به استفاده مستقیم از ارائه‌دهندگان دارد</li>
                </ul>
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 mt-3">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    <strong>نکته:</strong> برخی از مدل‌ها ممکن است رایگان باشند، اما برای استفاده از مدل‌های پیشرفته‌تر نیاز به خرید اعتبار دارید.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 3: Get API Key */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ml-2">
                3
              </span>
              دریافت API Key
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                پس از ثبت‌نام و خرید اعتبار، می‌توانید API Key خود را ایجاد کنید:
              </p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-2">مراحل:</p>
                  <ol className="list-decimal list-inside space-y-2 text-gray-700 dark:text-gray-300 mr-4">
                    <li>وارد داشبورد OpenRouter شوید</li>
                    <li>به بخش "API Keys" بروید</li>
                    <li>روی "Create API Key" کلیک کنید</li>
                    <li>یک نام برای API Key انتخاب کنید (مثلاً "AI Translator")</li>
                    <li>API Key ایجاد شده را کپی کنید</li>
                  </ol>
                </div>
                <div className="bg-gray-800 dark:bg-gray-950 rounded p-3 mt-3">
                  <p className="text-sm text-gray-400 mb-2">فرمت API Key:</p>
                  <code className="text-green-400 text-sm">sk-or-v1-...</code>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <p className="text-sm text-blue-800 dark:text-blue-200">
                    <strong>مهم:</strong> API Key شما را در جای امن نگه دارید و هرگز آن را در کد عمومی یا repository های عمومی قرار ندهید.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Step 4: Configure in App */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span className="bg-blue-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ml-2">
                4
              </span>
              تنظیم در برنامه
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-3">
              <p className="text-gray-700 dark:text-gray-300">
                پس از دریافت API Key، آن را در تنظیمات برنامه وارد کنید:
              </p>
              <div className="space-y-3">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white mb-2">تنظیمات مورد نیاز:</p>
                  <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mr-4">
                    <li><strong>Base URL:</strong> <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">https://openrouter.ai/api/v1</code></li>
                    <li><strong>API Key 1:</strong> API Key اصلی خود را وارد کنید</li>
                    <li><strong>API Key 2:</strong> (اختیاری) می‌توانید یک API Key دوم برای fallback اضافه کنید</li>
                    <li><strong>Referer:</strong> (اختیاری) آدرس وب‌سایت یا برنامه شما</li>
                    <li><strong>Site Name:</strong> (اختیاری) نام برنامه شما (مثلاً "AI Translator")</li>
                  </ul>
                </div>
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>نکته:</strong> OpenRouter با OpenAI SDK سازگار است و می‌توانید از همان API استفاده کنید.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Features */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span className="bg-green-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ml-2">
                ✨
              </span>
              ویژگی‌های OpenRouter
            </h3>
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mr-4">
                <li><strong>دسترسی به 300+ مدل:</strong> از مدل‌های مختلف ارائه‌دهندگان استفاده کنید</li>
                <li><strong>قیمت‌های بهتر:</strong> قیمت‌های بهینه‌تر نسبت به استفاده مستقیم</li>
                <li><strong>در دسترس بودن بالا:</strong> زیرساخت توزیع‌شده برای قابلیت اطمینان بیشتر</li>
                <li><strong>Fallback خودکار:</strong> در صورت مشکل یک ارائه‌دهنده، به دیگری تغییر می‌کند</li>
                <li><strong>عملکرد سریع:</strong> فقط ~15ms تأخیر اضافه می‌شود</li>
                <li><strong>سیاست‌های داده سفارشی:</strong> کنترل دقیق بر روی داده‌ها و مدل‌های مورد استفاده</li>
              </ul>
            </div>
          </section>

          {/* Tips */}
          <section>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-3 flex items-center">
              <span className="bg-yellow-500 text-white rounded-full w-8 h-8 flex items-center justify-center text-sm font-bold ml-2">
                💡
              </span>
              نکات مهم
            </h3>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4 space-y-2">
              <ul className="list-disc list-inside space-y-2 text-gray-700 dark:text-gray-300 mr-4">
                <li>API Key را در فایل <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">.env</code> ذخیره کنید و هرگز آن را commit نکنید</li>
                <li>می‌توانید از دو API Key استفاده کنید تا در صورت تمام شدن اعتبار یکی، از دیگری استفاده شود</li>
                <li>برای استفاده بهتر، Referer و Site Name را تنظیم کنید</li>
                <li>می‌توانید از داشبورد OpenRouter استفاده و مصرف خود را رصد کنید</li>
                <li>برخی مدل‌ها ممکن است نیاز به تأیید داشته باشند</li>
              </ul>
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            ESC برای بستن
          </div>
          <div className="flex gap-3">
            <a
              href="https://openrouter.ai/"
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors inline-flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              باز کردن OpenRouter
            </a>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition-colors"
            >
              فهمیدم
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

