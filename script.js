diff --git a/script.js b/script.js
index e6cdf5105fcb9a1cbdceb8d6f00d307489efa2df..294b1a5500564d8ca91726e3d0dd2763396a7649 100644
--- a/script.js
+++ b/script.js
@@ -1,760 +1,557 @@
-/* ============================================
-   For Two — script.js 完全版 v4.1
-   37.7MB動画対応 + 全機能統合
-   ============================================ */
-
-class ForTwoBuilder {
-    constructor() {
-        this.isEditing   = false;
-        this.storageKey  = 'fortwo_site_data';
-        this.mediaKey    = 'fortwo_media_data';
-        this.templateKey = 'fortwo_template_pikkas';
-        this.versionKey  = 'fortwo_element_count'; // 要素数チェック用
-
-        /* DOM要素取得 */
-        this.editBtn         = document.getElementById('editModeBtn');
-        this.previewBtn      = document.getElementById('previewBtn');
-        this.exportBtn       = document.getElementById('exportBtn');
-        this.templateBtn     = document.getElementById('templateBtn');
-        this.loadTemplateBtn = document.getElementById('loadTemplateBtn');
-        this.mobileBtn       = document.getElementById('mobilePreviewBtn');
-
-        /* メディア編集用 */
-        this._fileInput      = this._createFileInput();
-        this._activeMediaEl  = null;
-        this._mobileMode     = false;
-
-        this.init();
-    }
-
-    /* ============================================
-       初期化
-       ============================================ */
-    init() {
-        this.bindEvents();
-        this.loadData();
-        this.loadMediaData();
-        this.initScrollEffects();
-        this.initRevealAnimations();
-        this.initHamburgerMenu();
-        this.initSmoothScroll();
-        
-        console.log('✅ For Two Builder v4.1 起動完了');
-    }
-
-    /* ============================================
-       イベント登録
-       ============================================ */
-    bindEvents() {
-        if (this.editBtn)         this.editBtn.addEventListener('click', () => this.toggleEditMode());
-        if (this.previewBtn)      this.previewBtn.addEventListener('click', () => this.openPreview());
-        if (this.exportBtn)       this.exportBtn.addEventListener('click', () => this.exportHTML());
-        if (this.templateBtn)     this.templateBtn.addEventListener('click', () => this.saveTemplate());
-        if (this.loadTemplateBtn) this.loadTemplateBtn.addEventListener('click', () => this.loadTemplate());
-        if (this.mobileBtn)       this.mobileBtn.addEventListener('click', () => this.toggleMobilePreview());
-
-        // リセットボタン
-        const resetBtn = document.getElementById('resetDataBtn');
-        if (resetBtn) resetBtn.addEventListener('click', () => this.resetAllData());
-    }
-
-    /* ============================================
-       スクロール・アニメーション系
-       ============================================ */
-    initScrollEffects() {
-        const nav = document.getElementById('siteNav');
-        if (!nav) return;
-        
-        const onScroll = () => {
-            const scrolled = window.scrollY > 80;
-            nav.classList.toggle('scrolled', scrolled);
-        };
-        
-        window.addEventListener('scroll', onScroll, { passive: true });
-        onScroll();
-    }
-
-    initRevealAnimations() {
-        const targets = document.querySelectorAll('.reveal-up');
-        
-        if (!('IntersectionObserver' in window)) {
-            // IntersectionObserver非対応の場合は即座に表示
-            targets.forEach(el => el.classList.add('visible'));
-            return;
-        }
-
-        const observer = new IntersectionObserver((entries) => {
-            entries.forEach(entry => {
-                if (entry.isIntersecting) {
-                    entry.target.classList.add('visible');
-                    observer.unobserve(entry.target);
-                }
-            });
-        }, { 
-            threshold: 0.12, 
-            rootMargin: '-40px 0px' 
-        });
-
-        targets.forEach(el => observer.observe(el));
-    }
-
-    initHamburgerMenu() {
-        const hamburger = document.getElementById('navHamburger');
-        const navLinks  = document.getElementById('navLinks');
-        
-        if (!hamburger || !navLinks) return;
-
-        hamburger.addEventListener('click', () => {
-            navLinks.classList.toggle('open');
-        });
-
-        navLinks.querySelectorAll('a').forEach(link => {
-            link.addEventListener('click', () => {
-                navLinks.classList.remove('open');
-            });
-        });
-
-        // メニュー外クリックで閉じる
-        document.addEventListener('click', (e) => {
-            if (!hamburger.contains(e.target) && !navLinks.contains(e.target)) {
-                navLinks.classList.remove('open');
-            }
-        });
-    }
-
-    initSmoothScroll() {
-        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
-            anchor.addEventListener('click', (e) => {
-                const href = anchor.getAttribute('href');
-                if (!href || href === '#') return;
-                const target = document.querySelector(href);
-                if (!target) return;
-
-                e.preventDefault();
-                // scroll-padding-top（CSSで130px設定）を活かすためwindow.scrollToを使用
-                const scrollPadding = parseInt(
-                    getComputedStyle(document.documentElement).scrollPaddingTop
-                ) || 130;
-                const top = target.getBoundingClientRect().top + window.scrollY - scrollPadding;
-                window.scrollTo({ top, behavior: 'smooth' });
-            });
-        });
-    }
-
-    /* ============================================
-       編集モード
-       ============================================ */
-    toggleEditMode() {
-        this.isEditing = !this.isEditing;
-        document.body.classList.toggle('editing', this.isEditing);
-
-        if (this.isEditing) {
-            this.editBtn.textContent = '✅ 編集終了';
-            this.editBtn.style.background = '#666';
-            this.enableTextEditing();
-            this.enableMediaEditing();
-            this.enableTagEditing();
-            this.showToast('✏️ 編集モード ON：すべての機能が利用可能です');
-        } else {
-            this.editBtn.textContent = '✏️ 編集モード';
-            this.editBtn.style.background = '';
-            this.disableTextEditing();
-            this.disableMediaEditing();
-            this.disableTagEditing();
-            this.saveData();
-            this.showToast('💾 変更内容を保存しました！');
-        }
-    }
-
-    enableTextEditing() {
-        document.querySelectorAll('[data-editable="text"]').forEach(el => {
-            el.contentEditable = 'true';
-            el.addEventListener('blur', () => this.saveData());
-        });
-    }
-
-    disableTextEditing() {
-        document.querySelectorAll('[data-editable="text"]').forEach(el => {
-            el.contentEditable = 'false';
-        });
-    }
-
-    /* ============================================
-       タグ追加・削除機能
-       ============================================ */
-    enableTagEditing() {
-        document.querySelectorAll('[data-editable="tags"]').forEach(container => {
-            // 既存タグに削除ボタンを追加
-            container.querySelectorAll('.specialty-tag').forEach(tag => {
-                this._addTagDeleteBtn(tag);
-            });
-
-            // 追加ボタンを挿入
-            if (!container.querySelector('.tag-add-btn')) {
-                const addBtn = document.createElement('button');
-                addBtn.className = 'tag-add-btn';
-                addBtn.innerHTML = '<i class="fas fa-plus"></i> タグを追加';
-                addBtn.addEventListener('click', () => this._addNewTag(container));
-                container.appendChild(addBtn);
-            }
-        });
-    }
-
-    disableTagEditing() {
-        document.querySelectorAll('.tag-delete-btn').forEach(btn => btn.remove());
-        document.querySelectorAll('.tag-add-btn').forEach(btn => btn.remove());
-    }
-
-    _addTagDeleteBtn(tag) {
-        if (tag.querySelector('.tag-delete-btn')) return;
-        
-        const deleteBtn = document.createElement('button');
-        deleteBtn.className = 'tag-delete-btn';
-        deleteBtn.innerHTML = '×';
-        deleteBtn.title = 'このタグを削除';
-        deleteBtn.addEventListener('click', (e) => {
-            e.stopPropagation();
-            const tagText = tag.textContent.replace('×', '').trim();
-            if (confirm(`「${tagText}」を削除しますか？`)) {
-                tag.remove();
-                this.saveData();
-                this.showToast(`🗑️ タグ「${tagText}」を削除しました`);
-            }
-        });
-        tag.appendChild(deleteBtn);
-    }
-
-    _addNewTag(container) {
-        const tagText = prompt('追加するタグ名を入力してください：', '新しいタグ');
-        if (!tagText || !tagText.trim()) return;
-
-        const newTag = document.createElement('span');
-        newTag.className = 'specialty-tag';
-        newTag.setAttribute('data-editable', 'text');
-        newTag.textContent = tagText.trim();
-        newTag.contentEditable = 'true';
-
-        const addBtn = container.querySelector('.tag-add-btn');
-        container.insertBefore(newTag, addBtn);
-        
-        this._addTagDeleteBtn(newTag);
-        newTag.addEventListener('blur', () => this.saveData());
-        
-        this.saveData();
-        this.showToast(`✅ タグ「${tagText.trim()}」を追加しました`);
-    }
-
-    /* ============================================
-       メディア編集機能（37.7MB動画対応）
-       ============================================ */
-    _createFileInput() {
-        const input = document.createElement('input');
-        input.type   = 'file';
-        input.accept = 'image/*,video/*';
-        input.style.cssText = 'position:fixed;top:-9999px;left:-9999px;opacity:0;';
-        input.id = 'ftMediaFileInput';
-
-        input.addEventListener('change', (e) => {
-            const file = e.target.files[0];
-            if (file && this._activeMediaEl) {
-                this._processFile(file, this._activeMediaEl);
-            }
-            input.value = '';
-        });
-
-        document.body.appendChild(input);
-        return input;
-    }
-
-    enableMediaEditing() {
-        document.querySelectorAll('[data-editable="media"]').forEach(el => {
-            el.addEventListener('click', this._onMediaClick);
-            this._addMediaOverlay(el);
-        });
-    }
-
-    disableMediaEditing() {
-        document.querySelectorAll('[data-editable="media"]').forEach(el => {
-            el.removeEventListener('click', this._onMediaClick);
-            this._removeMediaOverlay(el);
-        });
-    }
-
-    _onMediaClick = (e) => {
-        // ヒーローセクション内の他の要素へのクリックは除外
-        if (e.target.closest('.hero-content') || e.target.closest('.scroll-indicator')) {
-            return;
-        }
-
-        e.stopPropagation();
-        this._activeMediaEl = e.currentTarget;
-        this._fileInput.click();
-    }
-
-    _addMediaOverlay(el) {
-        if (el.querySelector('.media-edit-overlay')) return;
-
-        const overlay = document.createElement('div');
-        overlay.className = 'media-edit-overlay';
-        overlay.innerHTML = `
-            <div class="media-edit-hint">
-                <i class="fas fa-camera"></i>
-                <span>クリックして差し替え</span>
-                <small>画像・動画対応（37MB対応）</small>
-            </div>
-        `;
-
-        const pos = getComputedStyle(el).position;
-        if (pos === 'static') {
-            el.style.position = 'relative';
-            el.dataset.hadStaticPosition = 'true';
-        }
-
-        el.appendChild(overlay);
-    }
-
-    _removeMediaOverlay(el) {
-        el.querySelectorAll('.media-edit-overlay').forEach(o => o.remove());
-        if (el.dataset.hadStaticPosition) {
-            el.style.position = '';
-            delete el.dataset.hadStaticPosition;
-        }
-    }
-
-    _processFile(file, container) {
-        const MB = file.size / 1024 / 1024;
-
-        /* 5MB超の場合：外部ファイル参照方式 */
-        if (MB > 5) {
-            const proceed = confirm(
-                `ファイルサイズが ${MB.toFixed(1)}MB です。\n\n` +
-                `ブラウザの制限（5MB）を超えるため、外部ファイル方式で対応します：\n` +
-                `1. 動画ファイルをわかりやすい名前に変更\n` +
-                `2. ダウンロード後、HTMLファイルと同じフォルダに配置\n\n` +
-                `この方式で設定しますか？`
-            );
-            
-            if (!proceed) return;
-
-            const fileName = prompt(
-                '動画ファイル名を入力してください（例：hero-video.mp4）:',
-                file.name.replace(/[^a-zA-Z0-9.-]/g, '-')
-            );
-            
-            if (fileName && fileName.trim()) {
-                const isVideo = file.type.startsWith('video/') || fileName.match(/\.(mp4|webm|mov)$/i);
-                this._applyMedia(container, fileName.trim(), isVideo, fileName.trim());
-                this._saveExternalFileInfo(container, fileName.trim(), isVideo, MB);
-                this.showToast(`✅ 外部ファイル「${fileName.trim()}」として設定しました`);
-            }
-            return;
-        }
-
-        /* 5MB以下は従来通り */
-        this.showToast('⏳ ファイルを読み込み中...');
-        
-        const reader = new FileReader();
-        reader.onload = (e) => {
-            const dataUrl = e.target.result;
-            const isVideo = file.type.startsWith('video/');
-            this._applyMedia(container, dataUrl, isVideo, file.name);
-            this._saveMediaToStorage(container, dataUrl, isVideo, file.name);
-            this.showToast(`✅ ${isVideo ? '動画' : '画像'}を差し替えました：${file.name}`);
-        };
-        reader.onerror = () => this.showToast('❌ ファイル読み込み失敗', 'error');
-        reader.readAsDataURL(file);
-    }
-
-    _applyMedia(container, dataUrl, isVideo, fileName) {
-        const existingImg   = container.querySelector('img');
-        const existingVideo = container.querySelector('video');
-
-        if (isVideo) {
-            const video = document.createElement('video');
-            video.src         = dataUrl;
-            video.autoplay    = true;
-            video.muted       = true;
-            video.loop        = true;
-            video.playsInline = true;
-            video.className   = existingImg?.className || existingVideo?.className || 'hero-media';
-            video.setAttribute('data-media-filename', fileName);
-
-            if (existingVideo) {
-                existingVideo.replaceWith(video);
-            } else if (existingImg) {
-                existingImg.replaceWith(video);
-            } else {
-                container.prepend(video);
-            }
-        } else {
-            if (existingImg) {
-                existingImg.src = dataUrl;
-                existingImg.setAttribute('data-media-filename', fileName);
-            } else if (existingVideo) {
-                const img = document.createElement('img');
-                img.src       = dataUrl;
-                img.className = existingVideo.className;
-                img.alt       = fileName;
-                img.setAttribute('data-media-filename', fileName);
-                existingVideo.replaceWith(img);
-            } else {
-                const img = document.createElement('img');
-                img.src       = dataUrl;
-                img.className = 'hero-media';
-                img.alt       = fileName;
-                container.prepend(img);
-            }
-        }
-    }
-
-    /* ============================================
-       スマホプレビューモード
-       ============================================ */
-    toggleMobilePreview() {
-        this._mobileMode = !this._mobileMode;
-        document.body.classList.toggle('mobile-preview-mode', this._mobileMode);
-
-        if (this._mobileMode) {
-            this.mobileBtn.textContent = '🖥️ PC表示に戻す';
-            this.mobileBtn.style.background = '#8e44ad';
-            this.showToast('📱 スマホプレビュー（375px）に切り替えました');
-        } else {
-            this.mobileBtn.textContent = '📱 スマホ確認';
-            this.mobileBtn.style.background = '';
-            this.showToast('🖥️ PC表示に戻しました');
-        }
-    }
-
-    /* ============================================
-       データ全リセット
-       ============================================ */
-    resetAllData() {
-        if (!confirm('すべての編集データをリセットしてHTMLの初期状態に戻しますか？\n（この操作は元に戻せません）')) return;
-        localStorage.removeItem(this.storageKey);
-        localStorage.removeItem(this.mediaKey);
-        localStorage.removeItem(this.versionKey);
-        this.showToast('🔄 データをリセットしました。ページを再読み込みします…');
-        setTimeout(() => location.reload(), 1500);
-    }
-
-    /* ============================================
-       データ保存・復元システム
-       ============================================ */
-    _getMediaId(container) {
-        const section = container.closest('[data-section]');
-        const sectionName = section ? section.dataset.section : 'unknown';
-        const index = Array.from(document.querySelectorAll('[data-editable="media"]')).indexOf(container);
-        return `media_${sectionName}_${index}`;
-    }
-
-    _saveMediaToStorage(container, dataUrl, isVideo, fileName) {
-        try {
-            const mediaData = JSON.parse(localStorage.getItem(this.mediaKey) || '{}');
-            const id = this._getMediaId(container);
-            mediaData[id] = { dataUrl, isVideo, fileName };
-            localStorage.setItem(this.mediaKey, JSON.stringify(mediaData));
-        } catch (err) {
-            console.warn('メディア保存エラー:', err);
-            this.showToast('⚠️ 保存容量が不足しています。', 'warning');
-        }
-    }
-
-    _saveExternalFileInfo(container, fileName, isVideo, fileSizeMB) {
-        try {
-            const mediaData = JSON.parse(localStorage.getItem(this.mediaKey) || '{}');
-            const id = this._getMediaId(container);
-            mediaData[id] = { 
-                fileName, 
-                isVideo, 
-                fileSizeMB, 
-                isExternal: true, 
-                timestamp: Date.now() 
-            };
-            localStorage.setItem(this.mediaKey, JSON.stringify(mediaData));
-        } catch (err) {
-            console.warn('外部ファイル情報保存エラー:', err);
-        }
-    }
-
-    loadMediaData() {
-        try {
-            const mediaData = JSON.parse(localStorage.getItem(this.mediaKey) || '{}');
-            document.querySelectorAll('[data-editable="media"]').forEach(container => {
-                const id = this._getMediaId(container);
-                if (mediaData[id]) {
-                    const { dataUrl, isVideo, fileName, isExternal } = mediaData[id];
-                    this._applyMedia(container, isExternal ? fileName : dataUrl, isVideo, fileName);
-                }
-            });
-        } catch (err) {
-            console.warn('メディア復元エラー:', err);
-        }
-    }
-
-    saveData() {
-        const data = {};
-        
-        // テキストデータ保存
-        document.querySelectorAll('[data-editable="text"]').forEach((el, i) => {
-            data[`text_${i}`] = el.innerHTML;
-        });
-
-        // タグデータ保存
-        document.querySelectorAll('[data-editable="tags"]').forEach((container, ci) => {
-            const tags = [];
-            container.querySelectorAll('.specialty-tag').forEach(tag => {
-                const tagText = tag.textContent.replace('×', '').trim();
-                if (tagText) tags.push(tagText);
-            });
-            data[`tags_${ci}`] = tags;
-        });
-
-        localStorage.setItem(this.storageKey, JSON.stringify(data));
-    }
-
-    loadData() {
-        try {
-            const data = JSON.parse(localStorage.getItem(this.storageKey) || '{}');
-
-            // ---- バージョンチェック ----
-            // HTMLが更新されて要素数が変わったら保存データをクリアしてズレを防ぐ
-            const currentCount = document.querySelectorAll('[data-editable="text"]').length;
-            const savedCount   = parseInt(localStorage.getItem(this.versionKey) || '0');
-
-            if (savedCount > 0 && savedCount !== currentCount) {
-                console.warn(
-                    `⚠️ 保存データの要素数(${savedCount})と現在のHTML(${currentCount})が不一致。`
-                    + ' 古いデータをクリアします。'
-                );
-                localStorage.removeItem(this.storageKey);
-                localStorage.removeItem(this.mediaKey);
-                localStorage.setItem(this.versionKey, String(currentCount));
-                return; // 復元せずデフォルトHTMLで表示
-            }
-            // 初回または一致している場合は要素数を記録
-            localStorage.setItem(this.versionKey, String(currentCount));
-            // ----------------------------
-            
-            // テキストデータ復元
-            document.querySelectorAll('[data-editable="text"]').forEach((el, i) => {
-                if (data[`text_${i}`] !== undefined) {
-                    el.innerHTML = data[`text_${i}`];
-                }
-            });
-
-            // タグデータ復元
-            document.querySelectorAll('[data-editable="tags"]').forEach((container, ci) => {
-                if (!data[`tags_${ci}`]) return;
-                
-                container.querySelectorAll('.specialty-tag').forEach(tag => tag.remove());
-                
-                data[`tags_${ci}`].forEach(tagText => {
-                    const tag = document.createElement('span');
-                    tag.className = 'specialty-tag';
-                    tag.setAttribute('data-editable', 'text');
-                    tag.textContent = tagText;
-                    container.appendChild(tag);
-                });
-            });
-        } catch (err) {
-            console.warn('データ復元エラー:', err);
-        }
-    }
-
-    /* ============================================
-       テンプレート管理・エクスポート
-       ============================================ */
-    saveTemplate() {
-        const template = {
-            version: '4.1-pikkas',
-            timestamp: new Date().toISOString(),
-            text: {},
-            media: JSON.parse(localStorage.getItem(this.mediaKey) || '{}')
-        };
-
-        document.querySelectorAll('[data-editable="text"]').forEach((el, i) => {
-            template.text[`text_${i}`] = el.innerHTML;
-        });
-
-        localStorage.setItem(this.templateKey, JSON.stringify(template));
-        this.showToast('📁 テンプレートを保存しました（全機能対応）！');
-    }
-
-    loadTemplate() {
-        const saved = localStorage.getItem(this.templateKey);
-        if (!saved) {
-            this.showToast('⚠️ 保存済みテンプレートがありません', 'warning');
-            return;
-        }
-        
-        if (!confirm('テンプレートを読み込みます。現在の内容は上書きされます。よろしいですか？')) {
-            return;
-        }
-        
-        try {
-            const template = JSON.parse(saved);
-
-            document.querySelectorAll('[data-editable="text"]').forEach((el, i) => {
-                if (template.text?.[`text_${i}`] !== undefined) {
-                    el.innerHTML = template.text[`text_${i}`];
-                }
-            });
-
-            if (template.media) {
-                localStorage.setItem(this.mediaKey, JSON.stringify(template.media));
-                this.loadMediaData();
-            }
-
-            this.showToast(`📂 テンプレート読み込み完了！(${template.version})`);
-        } catch (err) {
-            this.showToast('❌ テンプレート読み込みエラー', 'error');
-            console.error(err);
-        }
-    }
-
-    openPreview() {
-        if (this.isEditing) this.toggleEditMode();
-        setTimeout(() => window.open(window.location.href, '_blank'), 150);
-    }
-
-    exportHTML() {
-        const toolbar  = document.getElementById('builderToolbar');
-        const fileInput = document.getElementById('ftMediaFileInput');
-        
-        const hideEls = [toolbar, fileInput].filter(Boolean);
-        hideEls.forEach(el => { 
-            el.dataset.exportHide = el.style.display; 
-            el.style.display = 'none'; 
-        });
-
-        const originalPadding = document.body.style.paddingTop;
-        document.body.style.paddingTop = '116px';
-
-        document.querySelectorAll('.media-edit-overlay, .tag-add-btn, .tag-delete-btn').forEach(el => el.remove());
-
-        const wasMobile = this._mobileMode;
-        if (wasMobile) document.body.classList.remove('mobile-preview-mode');
-
-        const html = '<!DOCTYPE html>\n' + document.documentElement.outerHTML;
-
-        hideEls.forEach(el => { 
-            el.style.display = el.dataset.exportHide || ''; 
-        });
-        document.body.style.paddingTop = originalPadding;
-        if (wasMobile) document.body.classList.add('mobile-preview-mode');
-
-        const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
-        const url  = URL.createObjectURL(blob);
-        const a    = document.createElement('a');
-        a.href     = url;
-        a.download = `fortwo_v4_${Date.now()}.html`;
-        document.body.appendChild(a);
-        a.click();
-        document.body.removeChild(a);
-        URL.revokeObjectURL(url);
-
-        this.showToast('💾 完全版サイトをダウンロードしました！');
-    }
-
-    showToast(message, type = 'success') {
-        document.querySelector('.ft-toast')?.remove();
-
-        const colors = {
-            success: 'linear-gradient(135deg, #27ae60, #2ecc71)',
-            warning: 'linear-gradient(135deg, #f39c12, #f1c40f)',
-            error:   'linear-gradient(135deg, #e74c3c, #c0392b)'
-        };
-
-        const toast = document.createElement('div');
-        toast.className = 'ft-toast';
-        toast.textContent = message;
-        toast.style.cssText = `
-            position: fixed;
-            bottom: 32px;
-            left: 50%;
-            transform: translateX(-50%) translateY(20px);
-            background: ${colors[type] || colors.success};
-            color: #fff;
-            padding: 14px 32px;
-            border-radius: 50px;
-            font-size: 0.9rem;
-            font-weight: 600;
-            z-index: 99999;
-            opacity: 0;
-            transition: all 0.4s ease;
-            box-shadow: 0 8px 32px rgba(0,0,0,0.2);
-            pointer-events: none;
-        `;
-
-        document.body.appendChild(toast);
-
-        requestAnimationFrame(() => {
-            toast.style.opacity = '1';
-            toast.style.transform = 'translateX(-50%) translateY(0)';
-        });
-
-        setTimeout(() => {
-            toast.style.opacity = '0';
-            toast.style.transform = 'translateX(-50%) translateY(20px)';
-            setTimeout(() => toast.remove(), 400);
-        }, type === 'error' ? 4500 : 3000);
-    }
+'use strict';
+
+const DB_NAME = 'for_two_builder_vfs';
+const DB_VERSION = 1;
+const EDITABLE_SELECTOR = 'h1,h2,h3,h4,h5,h6,p,span,a,button,li,img,figcaption,blockquote';
+
+const DEFAULT_HTML = `<!doctype html>
+<html lang="ja">
+<head>
+  <meta charset="utf-8">
+  <meta name="viewport" content="width=device-width, initial-scale=1">
+  <title>For Two Builder Sample</title>
+  <style>
+    :root{--sky:#4AABDB;--peach:#F0A882;--text:#444;--ivory:#FDF8F4}
+    *{box-sizing:border-box}body{margin:0;font-family:system-ui,-apple-system,"Noto Sans JP",sans-serif;color:var(--text);background:linear-gradient(135deg,#fff,var(--ivory))}
+    .hero{min-height:100vh;padding:34px clamp(22px,5vw,72px)}.nav{display:flex;gap:18px;margin-bottom:64px}.nav a{font-weight:800;color:var(--sky);text-decoration:none}
+    .hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:42px;align-items:center}.eyebrow{color:var(--peach);font-weight:900;letter-spacing:.08em;text-transform:uppercase}
+    h1{font-size:clamp(38px,6vw,76px);line-height:1.04;margin:.1em 0}.lead{font-size:clamp(17px,2vw,22px);line-height:1.9}.cta{display:inline-block;margin-top:24px;padding:14px 22px;border-radius:999px;background:var(--sky);color:white;text-decoration:none;font-weight:900}
+    img{width:100%;border-radius:32px;box-shadow:0 28px 70px #4AABDB33}.section{padding:80px clamp(22px,5vw,72px);background:white}@media(max-width:760px){.hero-grid{grid-template-columns:1fr}.nav{margin-bottom:36px;flex-wrap:wrap}}
+  </style>
+</head>
+<body>
+  <header class="hero">
+    <nav class="nav"><a href="index.html">Home</a><a href="about.html">About</a><a href="#contact">Contact</a></nav>
+    <div class="hero-grid">
+      <div>
+        <p class="eyebrow">For Two Builder</p>
+        <h1>HTML 1枚だけのAIテンプレートも読み込めます。</h1>
+        <p class="lead">この初期サンプル自体もstyleタグ内蔵の単体HTMLです。外部CSSがなくてもiframeへそのまま描画され、クリック編集できます。</p>
+        <a class="cta" href="about.html">Aboutページへ</a>
+      </div>
+      <img src="https://placehold.co/920x620/4AABDB/ffffff?text=Single+HTML+Ready" alt="Single HTML Ready">
+    </div>
+  </header>
+  <section id="contact" class="section"><h2>data-uidを自動付与</h2><p>インポートHTMLに属性がなくても、プレビュー直前に編集可能属性を注入します。</p></section>
+</body>
+</html>`;
+
+const DEFAULT_ABOUT = DEFAULT_HTML
+  .replace('For Two Builder Sample', 'About - For Two Builder Sample')
+  .replace('HTML 1枚だけのAIテンプレートも読み込めます。', '内部リンクもビルダー内で遷移できます。')
+  .replace('この初期サンプル自体もstyleタグ内蔵の単体HTMLです。外部CSSがなくてもiframeへそのまま描画され、クリック編集できます。', 'iframe内のリンククリックをフックし、activeFileを切り替えるため、編集画面から外れません。')
+  .replace('<a class="cta" href="about.html">Aboutページへ</a>', '<a class="cta" href="index.html">Homeへ戻る</a>');
+
+class MemoryStore {
+  constructor() {
+    this.files = new Map();
+    this.assets = new Map();
+    this.meta = new Map();
+  }
+  async put(store, value) { this[store].set(value.path, value); return value; }
+  async get(store, path) { return this[store].get(path); }
+  async all(store) { return [...this[store].values()]; }
+  async clear() { this.files.clear(); this.assets.clear(); this.meta.clear(); }
 }
 
-/* ============================================
-   お問い合わせフォーム
-   ============================================ */
-function initContactForm() {
-    const form = document.getElementById('contactForm');
-    if (!form) return;
-
-    form.addEventListener('submit', (e) => {
-        e.preventDefault();
-
-        const data = Object.fromEntries(new FormData(form).entries());
-
-        const serviceNames = {
-            'normal':         '通常保育',
-            'english-care':   '英語保育',
-            'english-lesson': '英語レッスン',
-            'gymnastics':     '英語ジムナスティック',
-            'sst':            'SST保育（療育）',
-            'undecided':      'まだ決まっていない'
+class IndexedDBStore {
+  constructor() {
+    this.db = null;
+    this.fallback = false;
+    this.memory = new MemoryStore();
+  }
+  async open() {
+    if (!('indexedDB' in window)) {
+      this.fallback = true;
+      return this;
+    }
+    try {
+      this.db = await new Promise((resolve, reject) => {
+        const request = indexedDB.open(DB_NAME, DB_VERSION);
+        request.onupgradeneeded = () => {
+          const db = request.result;
+          ['files', 'assets', 'meta'].forEach((name) => {
+            if (!db.objectStoreNames.contains(name)) db.createObjectStore(name, { keyPath: 'path' });
+          });
         };
+        request.onsuccess = () => resolve(request.result);
+        request.onerror = () => reject(request.error);
+        request.onblocked = () => reject(new Error('IndexedDB upgrade was blocked.'));
+      });
+    } catch (error) {
+      console.warn('IndexedDB unavailable. Falling back to memory store.', error);
+      this.fallback = true;
+    }
+    return this;
+  }
+  objectStore(name, mode = 'readonly') {
+    return this.db.transaction(name, mode).objectStore(name);
+  }
+  async put(store, value) {
+    if (this.fallback) return this.memory.put(store, value);
+    return new Promise((resolve, reject) => {
+      const request = this.objectStore(store, 'readwrite').put(value);
+      request.onsuccess = () => resolve(value);
+      request.onerror = () => reject(request.error);
+    });
+  }
+  async get(store, path) {
+    if (this.fallback) return this.memory.get(store, path);
+    return new Promise((resolve, reject) => {
+      const request = this.objectStore(store).get(path);
+      request.onsuccess = () => resolve(request.result);
+      request.onerror = () => reject(request.error);
+    });
+  }
+  async all(store) {
+    if (this.fallback) return this.memory.all(store);
+    return new Promise((resolve, reject) => {
+      const request = this.objectStore(store).getAll();
+      request.onsuccess = () => resolve(request.result || []);
+      request.onerror = () => reject(request.error);
+    });
+  }
+  async clear() {
+    if (this.fallback) return this.memory.clear();
+    await Promise.all(['files', 'assets', 'meta'].map((store) => new Promise((resolve, reject) => {
+      const request = this.objectStore(store, 'readwrite').clear();
+      request.onsuccess = () => resolve();
+      request.onerror = () => reject(request.error);
+    })));
+  }
+}
 
-        const subject = encodeURIComponent(
-            `【For Two お問い合わせ】${data.name || '保護者様'}より`
-        );
+class VirtualFS {
+  constructor(store) {
+    this.store = store;
+    this.files = new Map();
+    this.assets = new Map();
+    this.meta = { path: 'project', activeFile: 'index.html', user_edits: {} };
+  }
+  async boot() {
+    try {
+      const [files, assets, meta] = await Promise.all([
+        this.store.all('files'),
+        this.store.all('assets'),
+        this.store.get('meta', 'project')
+      ]);
+      files.forEach((file) => this.files.set(file.path, file));
+      assets.forEach((asset) => this.assets.set(asset.path, asset));
+      if (meta && typeof meta === 'object') {
+        this.meta = { ...this.meta, ...meta, user_edits: meta.user_edits || {} };
+      }
+    } catch (error) {
+      console.warn('VFS load failed. Default project will be created.', error);
+      this.files.clear();
+      this.assets.clear();
+      this.meta = { path: 'project', activeFile: 'index.html', user_edits: {} };
+    }
+    if (!this.files.has(this.meta.activeFile) && !this.htmlFiles().length) {
+      await this.createDefaultProject(false);
+    } else if (!this.files.has(this.meta.activeFile)) {
+      this.meta.activeFile = this.htmlFiles()[0].path;
+      await this.saveMeta();
+    }
+  }
+  async createDefaultProject(clearEdits = true) {
+    if (clearEdits) this.meta.user_edits = {};
+    await this.writeText('index.html', DEFAULT_HTML, 'text/html');
+    await this.writeText('about.html', DEFAULT_ABOUT, 'text/html');
+    this.meta.activeFile = 'index.html';
+    await this.saveMeta();
+  }
+  async saveMeta() { await this.store.put('meta', this.meta); }
+  async writeText(path, template_code, type = 'text/plain') {
+    const record = { path: sanitizePath(path), kind: 'file', type, template_code, updatedAt: Date.now() };
+    this.files.set(record.path, record);
+    await this.store.put('files', record);
+    return record;
+  }
+  async writeAsset(path, blob, type = 'application/octet-stream') {
+    const record = { path: sanitizePath(path), kind: 'asset', type, blob, updatedAt: Date.now() };
+    this.assets.set(record.path, record);
+    await this.store.put('assets', record);
+    return record;
+  }
+  async importFiles(fileList) {
+    const imported = [...fileList];
+    let firstHtml = '';
+    for (const file of imported) {
+      const sourcePath = sanitizePath(file.webkitRelativePath || file.name);
+      const lowerPath = sourcePath.toLowerCase();
+      const isAsset = /\.(png|jpe?g|gif|webp|svg|avif|mp4|webm|mov|mp3|wav)$/i.test(sourcePath) || file.type.startsWith('image/') || file.type.startsWith('video/');
+      if (isAsset) {
+        const assetPath = sourcePath.startsWith('assets/') ? sourcePath : `assets/images/${file.name}`;
+        await this.writeAsset(assetPath, file, file.type || 'application/octet-stream');
+        continue;
+      }
+      const text = await file.text();
+      const normalizedPath = lowerPath.endsWith('.htm') ? sourcePath.replace(/\.htm$/i, '.html') : sourcePath;
+      const type = normalizedPath.endsWith('.html') ? 'text/html' : normalizedPath.endsWith('.css') ? 'text/css' : normalizedPath.endsWith('.js') ? 'text/javascript' : file.type || 'text/plain';
+      await this.writeText(normalizedPath, text, type);
+      if (!firstHtml && normalizedPath.endsWith('.html')) firstHtml = normalizedPath;
+    }
+    if (firstHtml) this.meta.activeFile = firstHtml;
+    await this.saveMeta();
+    return { count: imported.length, firstHtml };
+  }
+  htmlFiles() {
+    return [...this.files.values()].filter((file) => file.path.endsWith('.html')).sort(sortByPath);
+  }
+  allEntries() {
+    return [...this.files.values(), ...this.assets.values()].sort(sortByPath);
+  }
+}
 
-        const body = encodeURIComponent([
-            '以下の内容でお問い合わせがありました。',
-            '',
-            `■ お名前：${data.name || '（未入力）'}`,
-            `■ メールアドレス：${data.email || '（未入力）'}`,
-            `■ お子様の年齢：${data.childAge || '（未入力）'}`,
-            `■ ご希望日時：${data.preferredDate || '（未入力）'}`,
-            `■ ご希望のサービス：${serviceNames[data.service] || '（未選択）'}`,
-            '',
-            '■ ご質問・ご要望：',
-            data.message || '（未入力）',
-            '',
-            '---',
-            'For Two ホームページより送信'
-        ].join('\n'));
+class BuilderApp {
+  constructor() {
+    this.store = new IndexedDBStore();
+    this.vfs = null;
+    this.activeUid = '';
+    this.blobUrls = [];
+    this.$ = (selector) => document.querySelector(selector);
+  }
+  async init() {
+    await this.store.open();
+    this.vfs = new VirtualFS(this.store);
+    await this.vfs.boot();
+    this.bindEvents();
+    this.renderTree();
+    await this.setActiveFile(this.vfs.meta.activeFile, false);
+    this.toast(this.store.fallback ? 'メモリ倉庫で起動しました' : 'For Two Builderを起動しました', 'ok');
+  }
+  bindEvents() {
+    this.$('#importBtn').addEventListener('click', () => this.$('#fileInput').click());
+    this.$('#fileInput').addEventListener('change', (event) => this.handleImport(event.target.files));
+    this.$('#exportBtn').addEventListener('click', () => this.exportZip());
+    this.$('#createSampleBtn').addEventListener('click', async () => {
+      await this.vfs.createDefaultProject(true);
+      await this.setActiveFile('index.html');
+      this.toast('初期サンプルを生成しました', 'ok');
+    });
+    this.$('#clearStorageBtn').addEventListener('click', async () => {
+      if (!confirm('保存済みのVFSを消去して初期サンプルを再生成しますか？')) return;
+      await this.store.clear();
+      this.vfs = new VirtualFS(this.store);
+      await this.vfs.createDefaultProject(true);
+      await this.setActiveFile('index.html');
+      this.toast('倉庫をリセットしました', 'ok');
+    });
+    this.$('#addPageBtn').addEventListener('click', async () => {
+      const name = prompt('追加するHTMLファイル名', 'new-page.html');
+      if (!name) return;
+      const path = sanitizePath(name.endsWith('.html') ? name : `${name}.html`);
+      await this.vfs.writeText(path, DEFAULT_HTML.replace('For Two Builder Sample', path), 'text/html');
+      await this.setActiveFile(path);
+      this.toast(`${path} を追加しました`, 'ok');
+    });
+    this.$('#textInput').addEventListener('input', (event) => this.updateUserEdit({ text: event.target.value }));
+    this.$('#assetInput').addEventListener('change', (event) => this.replaceSelectedAsset(event.target.files[0]));
+    this.$('#discardEditBtn').addEventListener('click', () => this.discardSelectedEdit());
+    document.querySelectorAll('.device-btn').forEach((button) => {
+      button.addEventListener('click', () => {
+        document.querySelectorAll('.device-btn').forEach((item) => item.classList.remove('active'));
+        button.classList.add('active');
+        this.$('#previewFrame').style.width = button.dataset.width;
+      });
+    });
+    const dropZone = this.$('#dropZone');
+    ['dragenter', 'dragover'].forEach((name) => dropZone.addEventListener(name, (event) => {
+      event.preventDefault();
+      dropZone.classList.add('dragover');
+    }));
+    ['dragleave', 'drop'].forEach((name) => dropZone.addEventListener(name, (event) => {
+      event.preventDefault();
+      dropZone.classList.remove('dragover');
+    }));
+    dropZone.addEventListener('drop', (event) => this.handleImport(event.dataTransfer.files));
+    window.addEventListener('message', (event) => this.handleFrameMessage(event.data));
+  }
+  async handleImport(files) {
+    if (!files || !files.length) return;
+    try {
+      const result = await this.vfs.importFiles(files);
+      this.renderTree();
+      if (result.firstHtml) await this.setActiveFile(result.firstHtml);
+      else await this.renderPreview();
+      this.toast(result.firstHtml ? `${result.firstHtml} をメインHTMLとして読み込みました` : `${result.count}件を読み込みました`, 'ok');
+      this.$('#fileInput').value = '';
+    } catch (error) {
+      console.error(error);
+      this.toast(`インポートに失敗しました: ${error.message}`, 'error');
+    }
+  }
+  async setActiveFile(path, persist = true) {
+    const target = this.vfs.files.get(path) || this.vfs.htmlFiles()[0];
+    if (!target) {
+      await this.vfs.createDefaultProject(false);
+      return this.setActiveFile('index.html', persist);
+    }
+    this.vfs.meta.activeFile = target.path;
+    if (persist) await this.vfs.saveMeta();
+    this.$('#activePath').textContent = target.path;
+    this.renderTree();
+    await this.renderPreview();
+  }
+  renderTree() {
+    const tree = this.$('#fileTree');
+    tree.innerHTML = this.vfs.allEntries().map((entry) => {
+      const icon = entry.kind === 'asset' ? '🖼️' : entry.path.endsWith('.html') ? '🌐' : entry.path.endsWith('.css') ? '🎨' : '📄';
+      const active = entry.path === this.vfs.meta.activeFile ? ' active' : '';
+      return `<button class="file-item${active}" type="button" data-path="${escapeHtml(entry.path)}"><span>${icon}</span><span class="file-name">${escapeHtml(entry.path)}</span><span class="file-badge">${entry.kind}</span></button>`;
+    }).join('');
+    tree.querySelectorAll('.file-item').forEach((button) => {
+      button.addEventListener('click', () => {
+        const path = button.dataset.path;
+        if (path.endsWith('.html')) this.setActiveFile(path);
+        else this.toast('HTMLファイルを選択するとプレビューを切り替えます', 'ok');
+      });
+    });
+  }
+  async renderPreview() {
+    this.blobUrls.forEach((url) => URL.revokeObjectURL(url));
+    this.blobUrls = [];
+    const active = this.vfs.files.get(this.vfs.meta.activeFile) || this.vfs.htmlFiles()[0];
+    if (!active) return;
+    const html = await this.composeHtml(active.template_code, active.path, true);
+    this.$('#previewFrame').srcdoc = html;
+  }
+  async composeHtml(templateCode, htmlPath, includeBridge) {
+    const doc = new DOMParser().parseFromString(templateCode, 'text/html');
+    this.ensureDocumentShell(doc);
+    this.injectEditableAttributes(doc, htmlPath);
+    this.applyUserEdits(doc);
+    await this.resolveLinkedResources(doc, htmlPath);
+    if (includeBridge) this.injectPreviewBridge(doc);
+    return `<!doctype html>\n${doc.documentElement.outerHTML}`;
+  }
+  ensureDocumentShell(doc) {
+    if (!doc.head) doc.documentElement.insertBefore(doc.createElement('head'), doc.body || null);
+    if (!doc.body) doc.documentElement.appendChild(doc.createElement('body'));
+  }
+  injectEditableAttributes(doc, htmlPath) {
+    let index = 0;
+    doc.querySelectorAll(EDITABLE_SELECTOR).forEach((element) => {
+      if (!element.dataset.uid) {
+        const stableParts = [htmlPath, element.tagName.toLowerCase(), element.id || '', String(element.className || ''), normalizedText(element).slice(0, 48), index++];
+        element.dataset.uid = `uid_${hash(stableParts.join('|'))}`;
+      }
+      element.dataset.editable = element.tagName === 'IMG' ? 'image' : 'text';
+    });
+  }
+  applyUserEdits(doc) {
+    Object.entries(this.vfs.meta.user_edits || {}).forEach(([uid, edit]) => {
+      const element = doc.querySelector(`[data-uid="${cssEscape(uid)}"]`);
+      if (!element) return;
+      if (edit.text !== undefined && element.dataset.editable === 'text') element.textContent = edit.text;
+      if (edit.src && element.tagName === 'IMG') element.setAttribute('src', edit.src);
+      if (edit.alt && element.tagName === 'IMG') element.setAttribute('alt', edit.alt);
+    });
+  }
+  async resolveLinkedResources(doc, htmlPath) {
+    const assetMap = new Map();
+    for (const asset of this.vfs.assets.values()) {
+      const objectUrl = URL.createObjectURL(asset.blob);
+      this.blobUrls.push(objectUrl);
+      assetMap.set(asset.path, objectUrl);
+      assetMap.set(asset.path.split('/').pop(), objectUrl);
+    }
+    doc.querySelectorAll('img,video,source').forEach((element) => {
+      const src = element.getAttribute('src');
+      if (!src) return;
+      const normalized = normalizeRelativePath(htmlPath, src);
+      if (assetMap.has(src)) element.setAttribute('src', assetMap.get(src));
+      else if (assetMap.has(normalized)) element.setAttribute('src', assetMap.get(normalized));
+    });
+    doc.querySelectorAll('link[rel="stylesheet"][href]').forEach((link) => {
+      const href = link.getAttribute('href');
+      const cssFile = this.vfs.files.get(href) || this.vfs.files.get(normalizeRelativePath(htmlPath, href));
+      if (!cssFile) {
+        link.remove();
+        return;
+      }
+      const style = doc.createElement('style');
+      style.textContent = cssFile.template_code;
+      link.replaceWith(style);
+    });
+  }
+  injectPreviewBridge(doc) {
+    const style = doc.createElement('style');
+    style.textContent = '[data-editable]{cursor:pointer}[data-builder-selected]{outline:3px solid #4AABDB!important;outline-offset:4px!important;border-radius:6px!important}';
+    doc.head.appendChild(style);
+    const script = doc.createElement('script');
+    script.textContent = `(() => {\n  document.addEventListener('click', (event) => {\n    const editable = event.target.closest('[data-editable]');\n    if (editable) {\n      event.preventDefault();\n      event.stopPropagation();\n      document.querySelectorAll('[data-builder-selected]').forEach((node) => node.removeAttribute('data-builder-selected'));\n      editable.setAttribute('data-builder-selected', '');\n      parent.postMessage({ type: 'builder-select', uid: editable.dataset.uid, editable: editable.dataset.editable, text: editable.textContent, src: editable.getAttribute('src') || '', alt: editable.getAttribute('alt') || '' }, '*');\n      return;\n    }\n    const link = event.target.closest('a[href]');\n    if (!link) return;\n    const href = link.getAttribute('href');\n    if (!href || href.startsWith('#') || /^(https?:|mailto:|tel:|javascript:)/i.test(href)) return;\n    event.preventDefault();\n    parent.postMessage({ type: 'builder-navigate', href }, '*');\n  }, true);\n})();`;
+    doc.body.appendChild(script);
+  }
+  handleFrameMessage(message) {
+    if (!message || typeof message !== 'object') return;
+    if (message.type === 'builder-select') this.selectElement(message);
+    if (message.type === 'builder-navigate') {
+      const nextPath = normalizeRelativePath(this.vfs.meta.activeFile, message.href);
+      if (this.vfs.files.has(nextPath)) this.setActiveFile(nextPath);
+      else this.toast(`未登録ページです: ${nextPath}`, 'error');
+    }
+  }
+  selectElement(data) {
+    this.activeUid = data.uid;
+    this.$('#emptyInspector').hidden = true;
+    this.$('#editPanel').hidden = false;
+    this.$('#uidInput').value = data.uid;
+    this.$('#textField').hidden = data.editable !== 'text';
+    this.$('#assetField').hidden = data.editable !== 'image';
+    this.$('#textInput').value = data.text || '';
+  }
+  async updateUserEdit(patch) {
+    if (!this.activeUid) return;
+    this.vfs.meta.user_edits[this.activeUid] = { ...(this.vfs.meta.user_edits[this.activeUid] || {}), ...patch, updatedAt: Date.now() };
+    await this.vfs.saveMeta();
+    await this.renderPreview();
+  }
+  async replaceSelectedAsset(file) {
+    if (!file || !this.activeUid) return;
+    const filename = sanitizePath(file.name).split('/').pop();
+    const path = `assets/images/${Date.now()}-${filename}`;
+    await this.vfs.writeAsset(path, file, file.type || 'application/octet-stream');
+    await this.updateUserEdit({ src: path, alt: file.name });
+    this.renderTree();
+    this.toast('画像を差し替えました', 'ok');
+  }
+  async discardSelectedEdit() {
+    if (!this.activeUid) return;
+    delete this.vfs.meta.user_edits[this.activeUid];
+    await this.vfs.saveMeta();
+    await this.renderPreview();
+    this.toast('選択要素の編集を破棄しました', 'ok');
+  }
+  async exportZip() {
+    try {
+      const zip = new SimpleZip();
+      for (const file of this.vfs.files.values()) {
+        const content = file.path.endsWith('.html') ? await this.composeHtml(file.template_code, file.path, false) : file.template_code;
+        zip.addText(file.path, content);
+      }
+      for (const asset of this.vfs.assets.values()) zip.addBlob(asset.path, asset.blob);
+      zip.addText('builder-user-edits.json', JSON.stringify(this.vfs.meta.user_edits, null, 2));
+      const blob = await zip.generate();
+      downloadBlob(blob, 'for-two-builder-export.zip');
+      this.toast('ZIPを書き出しました', 'ok');
+    } catch (error) {
+      console.error(error);
+      this.toast(`エクスポートに失敗しました: ${error.message}`, 'error');
+    }
+  }
+  toast(message, type = '') {
+    const node = document.createElement('div');
+    node.className = `toast ${type}`;
+    node.textContent = message;
+    document.body.appendChild(node);
+    setTimeout(() => node.remove(), 3200);
+  }
+}
 
-        const toAddress = 'info@fortwo-example.com';
-        window.location.href = `mailto:${toAddress}?subject=${subject}&body=${body}`;
+class SimpleZip {
+  constructor() { this.entries = []; }
+  addText(path, text) { this.entries.push({ path: sanitizePath(path), dataPromise: Promise.resolve(new TextEncoder().encode(text)) }); }
+  addBlob(path, blob) { this.entries.push({ path: sanitizePath(path), dataPromise: blob.arrayBuffer().then((buffer) => new Uint8Array(buffer)) }); }
+  async generate() {
+    const localParts = [];
+    const centralParts = [];
+    let offset = 0;
+    for (const entry of this.entries) {
+      const data = await entry.dataPromise;
+      const name = new TextEncoder().encode(entry.path);
+      const crc = crc32(data);
+      const local = concatBytes(u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), name, data);
+      localParts.push(local);
+      const central = concatBytes(u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0), u32(crc), u32(data.length), u32(data.length), u16(name.length), u16(0), u16(0), u16(0), u16(0), u32(0), u32(offset), name);
+      centralParts.push(central);
+      offset += local.length;
+    }
+    const centralSize = centralParts.reduce((sum, part) => sum + part.length, 0);
+    const end = concatBytes(u32(0x06054b50), u16(0), u16(0), u16(this.entries.length), u16(this.entries.length), u32(centralSize), u32(offset), u16(0));
+    return new Blob([...localParts, ...centralParts, end], { type: 'application/zip' });
+  }
+}
 
-        if (window.builder) {
-            window.builder.showToast('📧 メールソフトを起動しました！');
-        }
-    });
+function sanitizePath(path) {
+  return String(path || '').replace(/\\/g, '/').replace(/^\/+/, '').replace(/\.\.\//g, '').trim() || 'index.html';
+}
+function sortByPath(a, b) { return a.path.localeCompare(b.path); }
+function normalizedText(element) {
+  return (element.getAttribute('alt') || element.textContent || element.getAttribute('src') || '').replace(/\s+/g, ' ').trim();
+}
+function hash(input) {
+  let h = 2166136261;
+  for (let i = 0; i < input.length; i += 1) {
+    h ^= input.charCodeAt(i);
+    h = Math.imul(h, 16777619);
+  }
+  return (h >>> 0).toString(36);
+}
+function cssEscape(value) {
+  if (window.CSS && CSS.escape) return CSS.escape(value);
+  return String(value).replace(/[^a-zA-Z0-9_-]/g, '\\$&');
+}
+function escapeHtml(value) {
+  return String(value).replace(/[&<>"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[char]));
+}
+function normalizeRelativePath(basePath, href) {
+  try {
+    return new URL(href, `https://builder.local/${basePath.replace(/[^/]*$/, '')}`).pathname.slice(1);
+  } catch {
+    return sanitizePath(href);
+  }
+}
+function downloadBlob(blob, filename) {
+  const link = document.createElement('a');
+  link.href = URL.createObjectURL(blob);
+  link.download = filename;
+  document.body.appendChild(link);
+  link.click();
+  link.remove();
+  setTimeout(() => URL.revokeObjectURL(link.href), 1200);
+}
+function u16(value) {
+  const bytes = new Uint8Array(2);
+  new DataView(bytes.buffer).setUint16(0, value, true);
+  return bytes;
+}
+function u32(value) {
+  const bytes = new Uint8Array(4);
+  new DataView(bytes.buffer).setUint32(0, value >>> 0, true);
+  return bytes;
+}
+function concatBytes(...arrays) {
+  const size = arrays.reduce((sum, item) => sum + item.length, 0);
+  const out = new Uint8Array(size);
+  let offset = 0;
+  arrays.forEach((item) => {
+    out.set(item, offset);
+    offset += item.length;
+  });
+  return out;
+}
+const CRC_TABLE = (() => {
+  const table = new Uint32Array(256);
+  for (let n = 0; n < 256; n += 1) {
+    let c = n;
+    for (let k = 0; k < 8; k += 1) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
+    table[n] = c >>> 0;
+  }
+  return table;
+})();
+function crc32(data) {
+  let c = 0xffffffff;
+  for (let i = 0; i < data.length; i += 1) c = CRC_TABLE[(c ^ data[i]) & 0xff] ^ (c >>> 8);
+  return (c ^ 0xffffffff) >>> 0;
 }
 
-/* ============================================
-   起動
-   ============================================ */
-document.addEventListener('DOMContentLoaded', () => {
-    window.builder = new ForTwoBuilder();
-    initContactForm();
+window.addEventListener('DOMContentLoaded', () => {
+  new BuilderApp().init().catch((error) => {
+    console.error(error);
+    const message = document.createElement('div');
+    message.className = 'toast error';
+    message.textContent = `起動に失敗しました: ${error.message}`;
+    document.body.appendChild(message);
+  });
 });
