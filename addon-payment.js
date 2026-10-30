// ============================================================
// 🧩 Addon: 支付系统 (Stripe + PayPal)
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

    window.addEventListener('load', () => {
        // 🚨 检查是否是 Stripe 支付成功后跳回来的
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') === 'success') {
            const sessionId = urlParams.get('session_id');
            if (sessionId) {
                // 显示加载动画
                if (typeof window.showToast === 'function') window.showToast('⏳ 正在验证支付结果...');

                fetch(`${BACKEND_URL}/api/stripe/check-session/${sessionId}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.success && data.licenseKey) {
                            if (typeof window.showToast === 'function') window.showToast('🎉 Stripe 支付成功！已为您永久解锁 PRO！');
                            if (typeof window.activateLifetimePro === 'function') {
                                window.activateLifetimePro();
                            }
                            // 清理 URL，防止用户刷新页面重复触发
                            window.history.replaceState({}, document.title, window.location.pathname);
                        } else {
                            if (typeof window.showToast === 'function') window.showToast('⚠️ 支付验证失败，请查看邮箱是否收到激活码');
                        }
                    }).catch(err => console.error(err));
            }
        }
        // 1. 绑定 Stripe 按钮
        const btnStripe = document.getElementById('btn-stripe-pay');
        if (btnStripe) {
            btnStripe.addEventListener('click', async (e) => {
                e.preventDefault();
                let email = window.userState?.email || prompt('请输入您的邮箱（用于接收激活码）：');
                if (!email) return;

                const originalText = btnStripe.innerHTML;
                btnStripe.innerHTML = '⏳ 正在跳转 Stripe...';
                btnStripe.disabled = true;

                try {
                    const res = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    const data = await res.json();

                    if (data.success && data.url) {
                        window.location.href = data.url;
                    } else {
                        alert('创建订单失败: ' + (data.error || '未知错误'));
                        btnStripe.innerHTML = originalText;
                        btnStripe.disabled = false;
                    }
                } catch (err) {
                    console.error(err);
                    alert('网络错误，请稍后再试');
                    btnStripe.innerHTML = originalText;
                    btnStripe.disabled = false;
                }
            });
        }

        // 2. 渲染 PayPal 按钮
        const paypalContainer = document.getElementById('paypal-button-container');
        if (paypalContainer && window.paypal) {
            window.paypal.Buttons({
                style: { layout: 'vertical', color: 'gold', shape: 'rect', label: 'paypal' },

                createOrder: async () => {
                    let email = window.userState?.email || prompt('请输入您的邮箱（用于接收激活码）：');
                    if (!email) throw new Error('需要邮箱才能支付');

                    const res = await fetch(`${BACKEND_URL}/api/paypal/create-order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email })
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error);
                    return data.orderId;
                },

                onApprove: async (data) => {
                    let email = window.userState?.email || ''; // 如果上面没拿到，这里可能为空，最好在 createOrder 时暂存
                    // 💡 小技巧：用闭包变量暂存当前用户的邮箱
                    const currentEmail = window._paypalCurrentEmail || email;

                    try {
                        const res = await fetch(`${BACKEND_URL}/api/paypal/capture-order`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: data.orderID, email: currentEmail })
                        });
                        const result = await res.json();

                        if (result.success && result.licenseKey) {
                            // ✅ 替换为直接调用全局激活函数
                            if (typeof window.showToast === 'function') window.showToast('🎉 支付成功！已为您永久解锁 PRO！');
                            if (typeof window.activateLifetimePro === 'function') {
                                window.activateLifetimePro(); // 直接在前端解锁 PRO 动画和权限
                            } else {
                                alert(`支付成功！您的激活码是：${result.licenseKey}\n请刷新页面以应用权限。`);
                            }
                        } else {
                            alert('捕获失败: ' + (result.error || '未知错误'));
                        }
                    } catch (err) {
                        console.error(err);
                        alert('捕获订单网络错误');
                    }
                },

                onError: (err) => {
                    console.error('PayPal 错误:', err);
                    if (typeof window.showToast === 'function') window.showToast('❌ PayPal 支付失败或取消');
                }
            }).render('#paypal-button-container');
        }
    });
})();