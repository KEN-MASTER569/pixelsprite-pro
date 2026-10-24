// ============================================================
// 🧩 Addon 2: 纯净独立登录系统
// ============================================================
(function () {
    'use strict';

    // 1. 初始化全局用户状态
    window.userState = {
        isLoggedIn: false,
        username: '',
        email: '',
        avatar: '',
        isGoogleVerified: false,
        lastLoginTimestamp: 0
    };

    // 2. 核心：控制大屏显示与隐藏
    window.forceShow = function (which) {
        const gate = document.getElementById('mandatory-auth-gate');
        const app = document.getElementById('app');

        if (which === 'app') {
            if (gate) gate.style.display = 'none';
            if (app) app.style.display = 'block';
        } else {
            if (gate) gate.style.display = 'flex';
            if (app) app.style.display = 'none';
        }
    };

    // 3. 更新右上角 UI（头像、名字）
    window.updateUserAuthUI = function () {
        const loginBtn = document.getElementById('btn-google-login');
        const pill = document.getElementById('user-profile-pill');
        const displayName = document.getElementById('user-display-name');
        const avatarBadge = document.getElementById('user-avatar-badge');
        const avatarImg = document.getElementById('user-avatar-img');

        if (window.userState.isLoggedIn) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (pill) pill.style.display = 'flex';
            if (displayName) displayName.textContent = window.userState.username || 'Artist';

            if (window.userState.avatar) {
                if (avatarImg) { avatarImg.src = window.userState.avatar; avatarImg.style.display = 'block'; }
                if (avatarBadge) avatarBadge.style.display = 'none';
            } else {
                if (avatarImg) avatarImg.style.display = 'none';
                if (avatarBadge) {
                    const initial = (window.userState.username || 'P').charAt(0).toUpperCase();
                    avatarBadge.textContent = initial;
                    avatarBadge.style.display = 'flex';
                }
            }
        } else {
            if (loginBtn) loginBtn.style.display = 'flex';
            if (pill) pill.style.display = 'none';
        }
    };

    // 4. 登录成功入口
    window.completeGoogleAuth = function (name, email, avatar) {
        if (!name) return;

        window.userState.isLoggedIn = true;
        window.userState.username = name;
        window.userState.email = email || '';
        window.userState.avatar = avatar || '';
        window.userState.isGoogleVerified = true;
        window.userState.lastLoginTimestamp = Date.now();

        try { localStorage.setItem('pixelsprite_google_user', JSON.stringify(window.userState)); } catch (e) { }

        // 关掉大闸，显示主界面
        const gate = document.getElementById('mandatory-auth-gate');
        if (gate) {
            gate.style.removeProperty('z-index');
            gate.style.removeProperty('pointer-events');
            gate.style.setProperty('display', 'none', 'important');
        }

        // 🚨 只关闭弹窗，绝不留下 pointer-events:none，
        // 否则之后再打开的弹窗全部点不动（这就是“重新登录后功能失灵”的根源）
        resetAllModals();

        const app = document.getElementById('app');
        if (app) {
            app.style.removeProperty('display'); // 清掉退出时写入的 !important
            app.style.display = 'block';
            app.style.pointerEvents = 'auto';
        }

        window.updateUserAuthUI();

        // 🚨 去掉了所有 remove() 的逻辑！
        // 不要在这里删 DOM！千万不要！

        // 🚨 核心修复：确保登录大闸彻底消失，并且主界面加载后，再启动教程
        if (!localStorage.getItem('pixelsprite_has_seen_guide')) {
            setTimeout(() => {
                const gate = document.getElementById('mandatory-auth-gate');
                // 如果大闸已经被隐藏了，才允许启动教程
                if (gate && gate.style.display === 'none' && typeof window.startCyberTour === 'function') {
                    window.startCyberTour(false);
                }
            }, 2000); // 稍微延长一点时间，确保一切都加载完毕
        }

        if (typeof window.showLoginWelcome === 'function') {
            window.showLoginWelcome(name);
        }

        // 🚨 新增：同时更新下拉菜单里的信息！
        const dropdownName = document.getElementById('dropdown-user-name');
        const dropdownEmail = document.getElementById('dropdown-user-email');
        const dropdownAvatarImg = document.getElementById('dropdown-avatar-img');
        const dropdownAvatarBadge = document.getElementById('dropdown-avatar-badge');

        if (dropdownName) dropdownName.textContent = name;
        if (dropdownEmail) dropdownEmail.textContent = email || 'Google User';

        if (avatar) {
            if (dropdownAvatarImg) {
                dropdownAvatarImg.src = avatar;
                dropdownAvatarImg.style.display = 'block';
            }
            if (dropdownAvatarBadge) dropdownAvatarBadge.style.display = 'none';
        } else {
            if (dropdownAvatarImg) dropdownAvatarImg.style.display = 'none';
            if (dropdownAvatarBadge) {
                const initial = (name || 'P').charAt(0).toUpperCase();
                dropdownAvatarBadge.textContent = initial;
                dropdownAvatarBadge.style.display = 'flex';
            }
        }

        if (typeof window.showToast === 'function') {
            const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.zh;
            window.showToast((dict.auth_welcome_toast || '🎉 欢迎，{name}！登录成功！').replace('{name}', name));
        }

        document.body.classList.add('logged-in');
    };

    // 关闭所有弹窗：只隐藏，并清除残留的 pointer-events，保证下次打开可正常点击
    function resetAllModals() {
        document.querySelectorAll('.modal-backdrop').forEach(el => {
            el.style.display = 'none';
            el.style.removeProperty('pointer-events');
        });
    }

    // 5. 退出登录入口
    window.performLogout = function (e) {
        if (e) { e.preventDefault(); e.stopPropagation(); }

        // 静态弹窗（HTML 里写死的）只能隐藏，不能 remove()
        resetAllModals();

        // 新手教程：必须正规结束，否则它的键盘监听会一直吞掉 空格/回车/Esc，
        // 且残留的 overlay 会让教程永远无法再次启动
        if (typeof window.endCyberTour === 'function') window.endCyberTour(true);
        // 动态生成的遮罩可以安全删除（下次会重新创建）
        document.querySelectorAll('#cyber-tour-overlay, #cyber-welcome-overlay').forEach(el => el.remove());

        // 顺手关掉下拉菜单
        const dropdown = document.getElementById('user-profile-dropdown');
        if (dropdown) { dropdown.classList.remove('show'); dropdown.style.removeProperty('display'); }

        // 保存草稿
        if (typeof saveDraftToDB === 'function') {
            saveDraftToDB();
        }

        // 1. 清空状态
        window.userState.isLoggedIn = false;
        window.userState.username = '';
        window.userState.email = '';
        window.userState.avatar = '';
        try { localStorage.removeItem('pixelsprite_google_user'); } catch (err) { }

        // 3. 强制隐藏头像胶囊
        const pill = document.getElementById('user-profile-pill');
        if (pill) pill.style.display = 'none';

        // 4. 强制显示顶栏的谷歌登录按钮
        const loginBtn = document.getElementById('btn-google-login') || document.getElementById('btn-header-login');
        if (loginBtn) {
            loginBtn.style.setProperty('display', 'flex', 'important');
            loginBtn.style.setProperty('pointer-events', 'auto', 'important');
        }

        // 🚨 核心修复：唤醒登录大闸
        const gate = document.getElementById('mandatory-auth-gate');
        if (gate) {
            gate.style.setProperty('display', 'flex', 'important'); // 强制显示
            gate.style.setProperty('pointer-events', 'auto', 'important'); // 强制可点击
            gate.style.setProperty('z-index', '999999', 'important');
        }

        // 6. 强行隐藏主界面
        const app = document.getElementById('app');
        if (app) {
            app.style.setProperty('display', 'none', 'important');
        }

        if (typeof window.showToast === 'function') {
            const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.zh;
            window.showToast(dict.auth_logout_toast || '👋 已成功退出登录');
        }
    };

    // 6. 触发 Google OAuth 登录
    window.triggerRealGoogleOAuth = function () {
        // 检查 SDK 是否就绪
        if (window.google && window.google.accounts && window.google.accounts.oauth2) {
            try {
                const client = window.google.accounts.oauth2.initTokenClient({
                    client_id: '507575159415-m4q68pnv2dkmll4osu59patd7fpdkp56.apps.googleusercontent.com',
                    scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                    callback: function (response) {
                        if (response && response.access_token) {
                            // 获取用户信息
                            fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                                headers: { Authorization: `Bearer ${response.access_token}` }
                            })
                                .then(r => r.json())
                                .then(profile => {
                                    if (profile && profile.email) {
                                        window.completeGoogleAuth(
                                            profile.name || profile.given_name || 'Google User',
                                            profile.email,
                                            profile.picture || ''
                                        );
                                    } else {
                                        const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.zh;
                                        if (typeof window.showToast === 'function') window.showToast(dict.auth_err_no_info || '⚠️ 无法获取 Google 信息');
                                    }
                                })
                                .catch(() => {
                                    const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.zh;
                                    if (typeof window.showToast === 'function') window.showToast(dict.auth_err_fetch_fail || '⚠️ 获取信息失败');
                                });
                        }
                    },
                    error_callback: function () {
                        const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.zh;
                        if (typeof window.showToast === 'function') window.showToast(dict.auth_cancel || '👋 已取消 Google 登录');
                    }
                });
                client.requestAccessToken();
                return;
            } catch (e) {
                console.warn('[Auth] OAuth 初始化失败:', e);
            }
        }
        if (typeof window.showToast === 'function') window.showToast('⚠️ Google 登录 SDK 未就绪，请刷新页面');
    };

    // 7. 启动检查（读取本地状态）
    function bootAuth() {
        let loggedIn = false;
        try {
            const raw = localStorage.getItem('pixelsprite_google_user');
            if (raw) {
                const parsed = JSON.parse(raw);
                // 简单校验 7 天有效期
                if (parsed.isLoggedIn && parsed.lastLoginTimestamp && (Date.now() - parsed.lastLoginTimestamp < 7 * 24 * 60 * 60 * 1000)) {
                    window.userState = parsed;
                    loggedIn = true;
                }
            }
        } catch (e) { }

        // 显示对应的界面
        // 🚨 终极防黑屏补丁：清理之前可能残留的 DOM 错误
        const gate = document.getElementById('mandatory-auth-gate');
        const app = document.getElementById('app');
        if (gate) gate.style.display = 'none';
        if (app) app.style.display = 'none';

        // 🚨 强制去本地缓存里再查一次状态（防止假数据）
        let realLoggedIn = false;
        if (window.userState && window.userState.isLoggedIn && window.userState.email) {
            realLoggedIn = true;
        }

        if (realLoggedIn) {
            if (app) app.style.display = 'block';
        } else {
            if (gate) {
                gate.style.display = 'flex';
                gate.style.pointerEvents = 'auto';
            }
        }
        window.updateUserAuthUI();

        // 🚨 关键修复 1：初始化下拉菜单的数据（解决截图里显示 Max Artist 的错误）
        const dropdownName = document.getElementById('dropdown-user-name');
        const dropdownEmail = document.getElementById('dropdown-user-email');
        const dropdownAvatarImg = document.getElementById('dropdown-avatar-img');
        const dropdownAvatarBadge = document.getElementById('dropdown-avatar-badge');

        if (loggedIn) {
            if (dropdownName) dropdownName.textContent = window.userState.username;
            if (dropdownEmail) dropdownEmail.textContent = window.userState.email || 'Google User';

            if (window.userState.avatar) {
                if (dropdownAvatarImg) { dropdownAvatarImg.src = window.userState.avatar; dropdownAvatarImg.style.display = 'block'; }
                if (dropdownAvatarBadge) dropdownAvatarBadge.style.display = 'none';
            } else {
                if (dropdownAvatarImg) dropdownAvatarImg.style.display = 'none';
                if (dropdownAvatarBadge) {
                    const initial = (window.userState.username || 'P').charAt(0).toUpperCase();
                    dropdownAvatarBadge.textContent = initial;
                    dropdownAvatarBadge.style.display = 'flex';
                }
            }
        }

        // 绑定【大屏】的 Google 登录按钮
        const gateLoginBtn = document.getElementById('btn-fast-google-signin-gate');
        if (gateLoginBtn) {
            gateLoginBtn.addEventListener('click', function (e) {
                e.preventDefault();
                window.triggerRealGoogleOAuth();
            });
        }

        // 绑定【顶栏】的 Google 登录按钮（如果存在）
        const headerLoginBtn = document.getElementById('btn-google-login');
        if (headerLoginBtn) {
            headerLoginBtn.addEventListener('click', function (e) {
                e.preventDefault();
                window.triggerRealGoogleOAuth();
            });
        }

        // 🚀 暴露到 window 全局
        window.triggerRealGoogleOAuth = window.triggerRealGoogleOAuth || function () {
            const client = window.google.accounts.oauth2.initTokenClient({
                client_id: '507575159415-m4q68pnv2dkmll4osu59patd7fpdkp56.apps.googleusercontent.com',
                scope: 'https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
                callback: function (response) {
                    if (response && response.access_token) {
                        fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
                            headers: { Authorization: `Bearer ${response.access_token}` }
                        }).then(r => r.json()).then(profile => {
                            if (profile && profile.email) {
                                window.completeGoogleAuth(profile.name || 'Google User', profile.email, profile.picture || '');
                            }
                        });
                    }
                },
                error_callback: function () {
                    const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.zh;
                    if (typeof window.showToast === 'function') window.showToast(dict.auth_cancel || '👋 已取消 Google 登录');
                }
            });
            client.requestAccessToken();
        };

        // 唯一绑定出口，干净利落
        ['btn-sign-out', 'btn-direct-logout', 'btn-dropdown-logout'].forEach(id => {
            const btn = document.getElementById(id);
            if (btn) {
                btn.onclick = window.performLogout;
                console.log(`✅ 退出按钮绑定成功！(${id})`);
            }
        });

        console.log('✅ 独立登录系统 (Addon) 已就绪');
    }

    // ============================================================
    // 🖼️ 个人资料修改功能 (点击头像直接换)
    // ============================================================
    document.addEventListener('DOMContentLoaded', () => {
        const btnEdit = document.getElementById('btn-edit-profile');
        const modal = document.getElementById('edit-profile-modal');
        const btnClose = document.getElementById('edit-profile-close');
        const btnSave = document.getElementById('btn-save-profile');

        const inputNickname = document.getElementById('input-edit-nickname');
        const inputAvatarFile = document.getElementById('input-edit-avatar');
        const avatarContainer = document.getElementById('edit-avatar-container');
        const previewImg = document.getElementById('edit-avatar-preview-img');
        const previewBadge = document.getElementById('edit-avatar-preview-badge');

        if (!btnEdit || !modal) return;

        let tempAvatarBase64 = null; // 暂存新头像

        // 1. 打开弹窗，回显当前数据
        btnEdit.addEventListener('click', (e) => {
            e.stopPropagation();
            const dropdown = document.getElementById('user-profile-dropdown');
            // 🚨 用 class 关闭，不要写 inline display:none，否则下拉菜单之后再也打不开
            if (dropdown) dropdown.classList.remove('show');

            inputNickname.value = window.userState.username || '';
            tempAvatarBase64 = null; // 重置暂存
            inputAvatarFile.value = ''; // 清空文件框

            // 渲染头像预览
            if (window.userState.avatar) {
                previewImg.src = window.userState.avatar;
                previewImg.style.display = 'block';
                previewBadge.style.display = 'none';
            } else {
                previewImg.style.display = 'none';
                previewBadge.textContent = (window.userState.username || 'P').charAt(0).toUpperCase();
                previewBadge.style.display = 'flex';
            }

            modal.style.display = 'flex';
        });

        // 2. 点击大头像，触发文件选择
        avatarContainer.addEventListener('click', () => {
            inputAvatarFile.click();
        });

        // 3. 选中文件后，立刻在弹窗里预览
        inputAvatarFile.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = (ev) => {
                tempAvatarBase64 = ev.target.result;
                previewImg.src = tempAvatarBase64;
                previewImg.style.display = 'block';
                previewBadge.style.display = 'none';
            };
            reader.readAsDataURL(file);
        });

        // 4. 点击保存
        btnSave.addEventListener('click', () => {
            const newName = inputNickname.value.trim();
            const dict = window.I18N_TRANSLATIONS[window.currentLang] || window.I18N_TRANSLATIONS.zh;
            if (!newName) {
                if (typeof window.showToast === 'function') window.showToast(dict.profile_name_empty || '⚠️ 昵称不能为空！');
                return;
            }

            window.userState.username = newName;
            if (tempAvatarBase64) {
                window.userState.avatar = tempAvatarBase64;
            }

            try {
                localStorage.setItem('pixelsprite_google_user', JSON.stringify(window.userState));
            } catch (err) {
                console.warn('保存失败，可能图片过大', err);
                if (typeof window.showToast === 'function') window.showToast(dict.profile_img_too_large || '⚠️ 图片过大，保存失败');
            }

            // 更新所有相关 UI
            window.updateUserAuthUI();

            const dropdownName = document.getElementById('dropdown-user-name');
            const dropdownAvatarImg = document.getElementById('dropdown-avatar-img');
            const dropdownAvatarBadge = document.getElementById('dropdown-avatar-badge');

            if (dropdownName) dropdownName.textContent = newName;
            if (tempAvatarBase64 && dropdownAvatarImg) {
                dropdownAvatarImg.src = tempAvatarBase64;
                dropdownAvatarImg.style.display = 'block';
                if (dropdownAvatarBadge) dropdownAvatarBadge.style.display = 'none';
            } else if (window.userState.avatar && dropdownAvatarImg) {
                dropdownAvatarImg.src = window.userState.avatar;
                dropdownAvatarImg.style.display = 'block';
                if (dropdownAvatarBadge) dropdownAvatarBadge.style.display = 'none';
            }

            if (typeof window.showToast === 'function') window.showToast(dict.profile_save_success || '✨ 资料修改成功！');
            modal.style.display = 'none';
        });

        btnClose.addEventListener('click', () => { modal.style.display = 'none'; });
    });

    // 页面加载完成后启动
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootAuth);
    } else {
        bootAuth();
    }
})();