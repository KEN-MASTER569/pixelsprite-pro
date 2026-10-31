// ============================================================
// 🧩 Addon: 支付系统 (Stripe + PayPal) - 赛博朋克 v2
// ------------------------------------------------------------
// 改进点：
//  - 内联邮箱输入框 + 校验，替代 prompt()
//  - 状态行提示，替代 alert()
//  - 价格终端（原价/折后价/折扣/省下金额）
//  - Esc / 点击遮罩关闭弹窗
//  - PayPal SDK 加载失败兜底提示，防止重复点击
// ⚠️ 安全提醒：price / discount 只是展示用，后端必须自己计算金额！
// ============================================================
(function () {
    'use strict';

    const BACKEND_URL = 'https://pixelsprite-backend.onrender.com';
    const EMAIL_KEY = 'pixelsprite_pay_email';
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

    const $ = (id) => document.getElementById(id);

    // 多语言辅助：先查字典，查不到再用内置三语兜底
    const t = (key) => (typeof window.t === 'function' ? window.t(key) : key);
    const L = (zh, en, ja) => {
        const lang = window.currentLang || 'en';
        if (lang.startsWith('zh')) return zh;
        if (lang === 'ja') return ja || en;
        return en;
    };
    const tt = (key, zh, en, ja) => {
        const v = t(key);
        return v && v !== key ? v : L(zh, en, ja);
    };
    const toast = (msg) => { if (typeof window.showToast === 'function') window.showToast(msg); };

    const getPromo = () => {
        if (typeof window.getDynamicPrice === 'function') return window.getDynamicPrice();
        return { isPromo: false, finalPrice: 19.99, originalPrice: 19.99, discount: 10 };
    };

    // ---------------- 状态行 ----------------
    function setStatus(msg, type = 'info') {
        const el = $('pay-status');
        if (!el) { if (msg) toast(msg); return; }
        el.textContent = msg || '';
        el.dataset.type = type;
        el.classList.toggle('show', !!msg);
    }

    // ---------------- 邮箱 ----------------
    function getEmail({ silent = false } = {}) {
        const input = $('pay-email-input');
        const hint = $('pay-email-hint');
        const email = (input ? input.value : (window.userState?.email || '')).trim();

        if (EMAIL_RE.test(email)) {
            try { localStorage.setItem(EMAIL_KEY, email); } catch (e) { }
            if (input) input.classList.remove('invalid');
            if (hint) hint.textContent = '';
            return email;
        }
        if (!silent) {
            if (input) {
                input.classList.remove('invalid');
                void input.offsetWidth; // 重新触发抖动动画
                input.classList.add('invalid');
                input.focus();
            }
            if (hint) hint.textContent = tt('pay_need_email', '⚠ 请输入有效邮箱，激活码将发送到这里', '⚠ Enter a valid email — your license key will be sent here', '⚠ 有効なメールを入力してください');
        }
        return null;
    }

    function prefillEmail() {
        const input = $('pay-email-input');
        if (!input || input.value) return;
        let saved = '';
        try { saved = localStorage.getItem(EMAIL_KEY) || ''; } catch (e) { }
        input.value = window.userState?.email || saved;
    }

    // ---------------- 价格终端 + 文案本地化 ----------------
    function renderCheckout() {
        const box = $('cyber-price-display');
        const p = getPromo();
        if (box) {
            const save = (p.originalPrice - p.finalPrice).toFixed(2);
            const offLabel = L(`${p.discount} 折`, `-${100 - p.discount * 10}%`, `${100 - p.discount * 10}% OFF`);
            box.innerHTML = p.isPromo
                ? `<div class="cp-tag">// ${L('限时特惠', 'LIMITED OFFER', '期間限定')}</div>
                   <div class="cp-row">
                     <span class="cp-old">$${p.originalPrice}</span>
                     <span class="cp-now" data-text="$${p.finalPrice}">$${p.finalPrice}</span>
                     <span class="cp-off">${offLabel}</span>
                   </div>
                   <div class="cp-sub">${L(`立省 $${save} · 一次付费 · 终身使用`, `SAVE $${save} · ONE-TIME · LIFETIME`, `$${save} お得 · 買い切り`)}</div>`
                : `<div class="cp-tag">// ${L('终身买断', 'LIFETIME LICENSE', '買い切り')}</div>
                   <div class="cp-row"><span class="cp-now" data-text="$${p.finalPrice}">$${p.finalPrice}</span><span class="cp-cur">USD</span></div>
                   <div class="cp-sub">${L('一次付费 · 终身使用 · 无订阅', 'ONE-TIME · LIFETIME · NO SUBSCRIPTION', '買い切り · サブスクなし')}</div>`;
        }

        const label = $('pay-email-label');
        if (label) label.textContent = '> ' + L('接收激活码的邮箱', 'EMAIL FOR LICENSE KEY', 'ライセンス送信先メール');

        const trust = $('cyber-trust-row');
        if (trust) {
            trust.innerHTML = `<li>🔒 ${L('安全加密支付', 'SECURE CHECKOUT', '安全な決済')}</li>
                               <li>⚡ ${L('即时解锁', 'INSTANT UNLOCK', '即時解放')}</li>
                               <li>♾️ ${L('终身更新', 'LIFETIME UPDATES', '永久アップデート')}</li>`;
        }
        prefillEmail();
        setStatus('');
    }

    // ---------------- 激活成功 ----------------
    function onLicense(licenseKey) {
        localStorage.setItem('pixelsprite_license_key', licenseKey);
        toast(t('pay_success_unlock'));
        if (typeof window.activateLifetimePro === 'function') {
            window.activateLifetimePro();
        } else {
            setStatus(L(`支付成功！激活码：${licenseKey}（请刷新页面）`, `Payment successful! License: ${licenseKey} (please refresh)`, `決済完了！ライセンス: ${licenseKey}`), 'success');
        }
    }

    // ---------------- 弹窗 UX：Esc / 点遮罩关闭 ----------------
    function bindModalUX() {
        const modal = $('pro-modal');
        if (!modal) return;
        const close = () => (window.closeProModal ? window.closeProModal() : (modal.style.display = 'none'));

        modal.addEventListener('mousedown', (e) => { if (e.target === modal) close(); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal.style.display === 'flex') close();
        });

        // 回车直接走 Stripe
        const input = $('pay-email-input');
        if (input) {
            input.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); $('btn-stripe-pay')?.click(); } });
            input.addEventListener('input', () => { input.classList.remove('invalid'); const h = $('pay-email-hint'); if (h) h.textContent = ''; });
        }

        // 每次弹窗"从隐藏变为显示"时刷新价格终端（兼容所有打开入口）
        let wasOpen = false;
        new MutationObserver(() => {
            const open = modal.style.display === 'flex';
            if (open && !wasOpen) { try { renderCheckout(); } catch (e) { console.error(e); } }
            wasOpen = open;
        }).observe(modal, { attributes: true, attributeFilter: ['style'] });
    }

    // ---------------- Stripe 结账回跳校验 ----------------
    function checkStripeReturn() {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('payment') !== 'success') return;
        const sessionId = urlParams.get('session_id');
        if (!sessionId) return;

        toast(t('pay_verifying'));
        fetch(`${BACKEND_URL}/api/stripe/check-session/${encodeURIComponent(sessionId)}`)
            .then(res => res.json())
            .then(data => {
                if (data.success && data.licenseKey) {
                    if (typeof window.showToast === 'function') window.showToast(t('pay_success_unlock'));
                    localStorage.setItem('pixelsprite_license_key', data.licenseKey);

                    if (typeof window.activateLifetimePro === 'function') {
                        window.activateLifetimePro();
                    }
                    // 🚨 弹出激活码窗口
                    showLicenseKeyModal(data.licenseKey);

                    window.history.replaceState({}, document.title, window.location.pathname);
                } else {
                    toast(t('pay_verify_fail'));
                }
            }).catch(err => { console.error(err); toast(t('pay_network_error')); });
    }

    // ---------------- Stripe ----------------
    function bindStripe() {
        const btn = $('btn-stripe-pay');
        if (!btn) return;
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            if (btn.disabled) return;
            const email = getEmail();
            if (!email) return;

            const originalHTML = btn.innerHTML;
            btn.innerHTML = `<span class="cyber-spinner"></span><span>${t('pay_stripe_redirect')}</span>`;
            btn.disabled = true;
            btn.classList.add('loading');
            setStatus(L('正在连接安全支付网关…', 'Connecting to secure gateway…', '決済ゲートウェイに接続中…'));

            const restore = () => { btn.innerHTML = originalHTML; btn.disabled = false; btn.classList.remove('loading'); };

            try {
                const res = await fetch(`${BACKEND_URL}/api/stripe/create-checkout-session`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, discount: getPromo().discount })
                });
                const data = await res.json();
                if (data.success && data.url) {
                    window.location.href = data.url;
                } else {
                    setStatus(t('pay_create_fail') + (data.error || 'Unknown error'), 'error');
                    restore();
                }
            } catch (err) {
                console.error(err);
                // Render 免费实例冷启动可能要 30s+，给出更友好的提示
                setStatus(tt('pay_network_error', '网络错误，服务器可能正在唤醒，请 30 秒后重试', 'Network error — the server may be waking up, retry in ~30s', 'ネットワークエラー、30秒後に再試行してください'), 'error');
                restore();
            }
        });
    }

    // ---------------- PayPal ----------------
    function bindPayPal() {
        const container = $('paypal-button-container');
        if (!container) return;

        let tries = 0;
        const timer = setInterval(() => {
            if (!window.paypal) {
                if (++tries > 80) {
                    clearInterval(timer);
                    container.innerHTML = `<div class="paypal-fallback">${L('PayPal 加载失败（可能被广告拦截器屏蔽），请使用信用卡支付或刷新重试', 'PayPal failed to load (maybe blocked by an ad-blocker). Use card or refresh.', 'PayPal の読み込みに失敗しました')}</div>`;
                }
                return;
            }
            clearInterval(timer);

            let emailRejected = false;
            window.paypal.Buttons({
                style: { layout: 'vertical', color: 'black', shape: 'rect', label: 'paypal', height: 48 },

                onClick: (data, actions) => {
                    emailRejected = false;
                    if (!getEmail()) { emailRejected = true; return actions.reject(); }
                    setStatus('');
                    return actions.resolve();
                },

                createOrder: async () => {
                    const email = getEmail({ silent: true });
                    window._paypalCurrentEmail = email;
                    const res = await fetch(`${BACKEND_URL}/api/paypal/create-order`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email, price: getPromo().finalPrice })
                    });
                    const data = await res.json();
                    if (!data.success) throw new Error(data.error || 'create-order failed');
                    return data.orderId;
                },

                onApprove: async (data) => {
                    setStatus(t('pay_verifying'));
                    try {
                        const res = await fetch(`${BACKEND_URL}/api/paypal/capture-order`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ orderId: data.orderID, email: window._paypalCurrentEmail || '' })
                        });
                        const result = await res.json();
                        if (result.success && result.licenseKey) {
                            if (typeof window.showToast === 'function') window.showToast(t('pay_success_unlock'));
                            localStorage.setItem('pixelsprite_license_key', result.licenseKey);

                            if (typeof window.activateLifetimePro === 'function') {
                                window.activateLifetimePro();
                            }
                            // 🚨 弹出激活码窗口
                            showLicenseKeyModal(result.licenseKey);
                        } else {
                            setStatus(L('扣款确认失败：', 'Capture failed: ', '確定に失敗: ') + (result.error || 'Unknown'), 'error');
                        }
                    } catch (err) {
                        console.error(err);
                        setStatus(t('pay_network_error'), 'error');
                    }
                },

                onCancel: () => setStatus(t('pay_paypal_cancel'), 'info'),

                onError: (err) => {
                    if (emailRejected) return;
                    console.error('PayPal 错误:', err);
                    setStatus(L('PayPal 出错了，请重试或改用信用卡', 'PayPal error — please retry or use card', 'PayPal エラー'), 'error');
                }
            }).render('#paypal-button-container');
        }, 100);
    }

    // 🚨 新增：支付成功后，直接全屏展示激活码
    function showLicenseKeyModal(licenseKey) {
        // 防止重复弹窗
        if (document.getElementById('license-success-modal')) return;

        const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.en;

        const modal = document.createElement('div');
        modal.id = 'license-success-modal';
        modal.className = 'modal-backdrop';
        modal.style.display = 'flex';
        modal.style.zIndex = '9999999';
        modal.innerHTML = `
        <div class="modal-card" style="text-align: center; border-color: #ffc439; box-shadow: 0 0 40px rgba(255, 196, 57, 0.3); width: 400px;">
            <h2 style="color: #ffc439; font-family: 'Outfit'; font-size: 24px; margin-bottom: 10px;">🎉 支付成功！</h2>
            <p style="color: var(--text-main); font-size: 14px; margin-bottom: 20px;">您的 PRO 终身尊享版已激活！<br>请务必保存下方的专属激活码，以便未来更换设备时使用：</p>
            
            <div style="background: rgba(0,0,0,0.5); border: 2px dashed #00f2fe; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                <strong style="font-size: 24px; letter-spacing: 2px; color: #00f2fe; font-family: monospace;">${licenseKey}</strong>
            </div>
            
            <button id="btn-close-license" class="btn btn-primary" style="width: 100%; font-weight: 800; padding: 12px;">我已保存，开始创作 🚀</button>
        </div>
    `;
        document.body.appendChild(modal);

        // 复制功能
        const keyBox = modal.querySelector('strong');
        keyBox.style.cursor = 'pointer';
        keyBox.title = '点击复制';
        keyBox.onclick = () => {
            navigator.clipboard.writeText(licenseKey);
            keyBox.style.color = '#4ADE80';
            setTimeout(() => keyBox.style.color = '#00f2fe', 1000);
            if (typeof window.showToast === 'function') window.showToast('已复制到剪贴板');
        };

        document.getElementById('btn-close-license').onclick = () => {
            modal.remove();
            document.getElementById('pro-modal').style.display = 'none';
        };
    }

    window.addEventListener('load', () => {
        checkStripeReturn();
        bindStripe();
        bindPayPal();
        bindModalUX();
        prefillEmail();
    });
})();