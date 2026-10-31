// ============================================================
// 🧩 Addon: 支付系统 (Stripe + PayPal) - 多语言最终版
// ============================================================
(function () {
    'use strict';

    const BACKEND_URL = 'https://pixelsprite-backend.onrender.com';

    // 获取当前动态价格
    const getPrice = () => {
        if (window.currentPromo) return window.currentPromo.finalPrice;
        if (typeof window.getDynamicPrice === 'function') return window.getDynamicPrice().finalPrice;
        return 19.99;
    };

    // 多语言辅助函数
    const t = (key) => {
        if (typeof window.t === 'function') return window.t(key);
        return key;
    };

    window.addEventListener('load', () => {
        // 🚨 检查是否是 Stripe 支付成功后跳回来的
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success') {
            const sessionId = urlParams.get('session_id');
            if (sessionId) {
                if (typeof window.showToast === 'function') window.showToast(t('pay_verifying'));

                fetch(`${BACKEND_URL}/api/stripe/check-session/${sessionId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.licenseKey) {
                            if (typeof window.showToast === 'function') window.showToast(t('pay_success_unlock'));
                            if (typeof window.activateLifetimePro === 'function') {
                                window.activateLifetimePro();
                            }
                            window.history.replaceState({}, document.title, window.location.pathname);
                        } else {
                            if (typeof window.showToast === 'function') window.showToast(t('pay_verify_fail'));
                        }
                    }).catch(err => console.error(err));
            }
        }

        // 1. 绑定 Stripe 按钮
        const btnStripe = document.getElementById('btn-stripe-pay');
        if (btnStripe) {
            btnStripe.addEventListener('click', async (e) => {
                e.preventDefault();
                let email = window.userState?.email || prompt(t('pay_prompt_email'));
                if (!email) return;

                const originalText = btnStripe.innerHTML;
                btnStripe.innerHTML = t('pay_stripe_redirect');
                btnStripe.disabled = true;

                try {
                    // 动态获取折扣
                    const promo = typeof window.getDynamicPrice === 'function' ? window.getDynamicPrice() : { discount: 10 };
                    const discountValue = promo.discount;

                    const res = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, discount: discountValue })
                    });
                    const data = await res.json();

                    if (data.success && data.url) {
                        window.location.href = data.url;
                    } else {
                        alert(t('pay_create_fail') + (data.error || 'Unknown error'));
                        btnStripe.innerHTML = originalText;
                        btnStripe.disabled = false;
                    }
                } catch (err) {
                    console.error(err);
                    alert(t('pay_network_error'));
                    btnStripe.innerHTML = originalText;
                    btnStripe.disabled = false;
                }
            });
        }

        // 2. 渲染 PayPal 按钮
        const paypalContainer = document.getElementById('paypal-button-container');
        if (paypalContainer) {
            let paypalCheckCount = 0;
            const checkPayPal = setInterval(() => {
                if (window.paypal) {
                    clearInterval(checkPayPal);

                    window.paypal.Buttons({
                        style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },

                        createOrder: async () => {
                            let email = window.userState?.email || prompt(t('pay_prompt_email'));
                            if (!email) throw new Error(t('pay_need_email'));

                            window._paypalCurrentEmail = email;
                            const finalPrice = getPrice();

                            const res = await fetch(`${BACKEND_URL}/api/paypal/create-order`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ email: email, price: finalPrice })
                            });
                            const data = await res.json();
                            if (!data.success) throw new Error(data.error);
                            return data.orderId;
                        },

                        onApprove: async (data) => {
                            const currentEmail = window._paypalCurrentEmail || (window.userState?.email || '');

                            try {
                                const res = await fetch(`${BACKEND_URL}/api/paypal/capture-order`, {
                                    method: 'POST',
                                    headers: { 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ orderId: data.orderID, email: currentEmail })
                                });
                                const result = await res.json();

                                if (result.success && result.licenseKey) {
                                    if (typeof window.showToast === 'function') window.showToast(t('pay_success_unlock'));
                                    if (typeof window.activateLifetimePro === 'function') {
                                        window.activateLifetimePro();
                                    } else {
                                        alert(`支付成功！您的激活码是：${result.licenseKey}\n请刷新页面以应用权限。`);
                                    }
                                } else {
                                    alert('捕获失败: ' + (result.error || '未知错误'));
                                }
                            } catch (err) {
                                console.error(err);
                                alert(t('pay_network_error'));
                            }
                        },

                        onError: (err) => {
                            console.error('PayPal 错误:', err);
                            if (typeof window.showToast === 'function') window.showToast(t('pay_paypal_cancel'));
                        }
                    }).render('#paypal-button-container');
                } else {
                    paypalCheckCount++;
                    if (paypalCheckCount > 50) {
                        clearInterval(checkPayPal);
                        console.error('PayPal SDK 加载超时');
                    }
                }
            }, 100);
        }
    });
})();