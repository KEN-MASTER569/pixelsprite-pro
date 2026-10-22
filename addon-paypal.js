// ============================================================
// 🧩 Addon: Itch.io 模式（已弃用 PayPal 支付）
// ============================================================
(function () {
    'use strict';

    // 关闭之前的 PayPal 渲染逻辑，防止干扰 Itch.io 激活面板
    window.initPayPalSystem = function () {
        console.log('💡 当前已切换至 Itch.io 模式，PayPal 支付系统已禁用。');
    };

    // 暴露一个空的 renderPayPalButtons 防止 app.js 报错
    window.renderPayPalButtons = function () {
        // 不做任何事
    };

    // 修复 handlePayPalSuccess 逻辑（如果之前有地方调用）
    window.handlePayPalSuccess = function () {
        console.log('💡 PayPal 支付已禁用，请使用 Itch.io 激活码。');
    };
})();