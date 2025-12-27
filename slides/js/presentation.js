// Kiroライトニングトーク - プレゼンテーション設定

// Reveal.js初期化
Reveal.initialize({
    // 基本設定
    hash: true,
    controls: true,
    progress: true,
    center: false,
    touch: true,
    loop: false,
    rtl: false,
    
    // ナビゲーション
    keyboard: true,
    overview: true,
    disableLayout: false,
    
    // トランジション
    transition: 'slide', // none/fade/slide/convex/concave/zoom
    transitionSpeed: 'default', // default/fast/slow
    backgroundTransition: 'fade', // none/fade/slide/convex/concave/zoom
    
    // 表示設定
    width: 1280,
    height: 720,
    margin: 0.04,
    minScale: 0.2,
    maxScale: 2.0,
    
    // プラグイン
    plugins: [
        RevealMarkdown,
        RevealHighlight,
        RevealNotes
    ],
    
    // マークダウン設定
    markdown: {
        smartypants: true
    },
    
    // ハイライト設定
    highlight: {
        highlightOnLoad: true,
        tabReplace: '  '
    }
});

// カスタム機能

// スライド番号表示
function updateSlideNumber() {
    const indices = Reveal.getIndices();
    const totalSlides = Reveal.getTotalSlides();
    const slideNumber = document.querySelector('.slide-number');
    
    if (slideNumber) {
        slideNumber.textContent = `${indices.h + 1} / ${totalSlides}`;
    }
}

// スライド変更時のイベント
Reveal.on('slidechanged', event => {
    updateSlideNumber();
    
    // 現在のスライドにフォーカス
    const currentSlide = event.currentSlide;
    if (currentSlide) {
        currentSlide.focus();
    }
    
    // デバッグ情報（開発時のみ）
    if (window.location.hostname === 'localhost') {
        console.log('Current slide:', event.indexh, event.indexv);
    }
});

// 準備完了時の処理
Reveal.on('ready', event => {
    console.log('Reveal.js is ready');
    updateSlideNumber();
    
    // スライド番号要素を追加
    if (!document.querySelector('.slide-number')) {
        const slideNumber = document.createElement('div');
        slideNumber.className = 'slide-number';
        slideNumber.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: rgba(37, 99, 235, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            font-weight: bold;
            z-index: 1000;
        `;
        document.body.appendChild(slideNumber);
        updateSlideNumber();
    }
});

// キーボードショートカット
document.addEventListener('keydown', function(event) {
    // F11でフルスクリーン切り替え
    if (event.key === 'F11') {
        event.preventDefault();
        toggleFullscreen();
    }
    
    // Escapeでオーバービュー終了
    if (event.key === 'Escape' && Reveal.isOverview()) {
        Reveal.toggleOverview();
    }
});

// フルスクリーン切り替え
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(err => {
            console.log('フルスクリーンモードに入れませんでした:', err);
        });
    } else {
        document.exitFullscreen();
    }
}

// ユーティリティ関数

// スライドにクラスを追加
function addSlideClass(slideIndex, className) {
    const slide = Reveal.getSlide(slideIndex);
    if (slide) {
        slide.classList.add(className);
    }
}

// 現在のスライド情報を取得
function getCurrentSlideInfo() {
    const indices = Reveal.getIndices();
    const currentSlide = Reveal.getCurrentSlide();
    
    return {
        horizontal: indices.h,
        vertical: indices.v,
        element: currentSlide,
        title: currentSlide ? currentSlide.querySelector('h1, h2, h3')?.textContent : null
    };
}

// プレゼンテーション統計
function getPresentationStats() {
    return {
        totalSlides: Reveal.getTotalSlides(),
        currentSlide: Reveal.getIndices().h + 1,
        progress: Reveal.getProgress(),
        isOverview: Reveal.isOverview(),
        isPaused: Reveal.isPaused()
    };
}

// インタラクティブ要素の初期化
function initInteractiveElements() {
    // 進捗バーのアニメーション
    const progressBars = document.querySelectorAll('.progress-fill');
    progressBars.forEach(bar => {
        const width = bar.dataset.width || '0%';
        setTimeout(() => {
            bar.style.width = width;
        }, 500);
    });
    
    // 統計カウンターのアニメーション
    const statNumbers = document.querySelectorAll('.stat-number');
    statNumbers.forEach(stat => {
        const finalValue = stat.textContent;
        if (!isNaN(finalValue)) {
            animateCounter(stat, 0, parseInt(finalValue), 1000);
        }
    });
    
    // ホバーエフェクトの追加
    const statItems = document.querySelectorAll('.stat-item');
    statItems.forEach(item => {
        item.addEventListener('mouseenter', () => {
            item.style.transform = 'translateY(-5px) scale(1.02)';
        });
        
        item.addEventListener('mouseleave', () => {
            item.style.transform = 'translateY(0) scale(1)';
        });
    });
}

// カウンターアニメーション
function animateCounter(element, start, end, duration) {
    const startTime = performance.now();
    
    function updateCounter(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const current = Math.floor(start + (end - start) * easeOutQuart(progress));
        element.textContent = current.toLocaleString();
        
        if (progress < 1) {
            requestAnimationFrame(updateCounter);
        }
    }
    
    requestAnimationFrame(updateCounter);
}

// イージング関数
function easeOutQuart(t) {
    return 1 - Math.pow(1 - t, 4);
}

// スライド固有のアニメーション
function handleSlideAnimations(event) {
    const currentSlide = event.currentSlide;
    
    // 統計スライドでのアニメーション
    if (currentSlide.querySelector('.stats')) {
        setTimeout(() => {
            initInteractiveElements();
        }, 300);
    }
    
    // コードブロックのハイライト
    const codeBlocks = currentSlide.querySelectorAll('pre code');
    codeBlocks.forEach(block => {
        // シンタックスハイライトの再適用
        if (window.Prism) {
            Prism.highlightElement(block);
        }
    });
}

// キーボードショートカットの拡張
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(event) {
        // F11でフルスクリーン切り替え
        if (event.key === 'F11') {
            event.preventDefault();
            toggleFullscreen();
        }
        
        // Escapeでオーバービュー終了
        if (event.key === 'Escape' && Reveal.isOverview()) {
            Reveal.toggleOverview();
        }
        
        // 'h'でヘルプ表示
        if (event.key === 'h' || event.key === 'H') {
            showHelp();
        }
        
        // 's'でスピーカーノート
        if (event.key === 's' || event.key === 'S') {
            Reveal.getPlugin('notes').open();
        }
    });
}

// ヘルプモーダル
function showHelp() {
    const helpModal = document.createElement('div');
    helpModal.className = 'help-modal';
    helpModal.innerHTML = `
        <div class="help-content">
            <h3>キーボードショートカット</h3>
            <ul>
                <li><kbd>→</kbd> / <kbd>Space</kbd> - 次のスライド</li>
                <li><kbd>←</kbd> - 前のスライド</li>
                <li><kbd>Esc</kbd> - オーバービュー終了</li>
                <li><kbd>O</kbd> - オーバービュー表示</li>
                <li><kbd>F11</kbd> - フルスクリーン切り替え</li>
                <li><kbd>S</kbd> - スピーカーノート</li>
                <li><kbd>H</kbd> - このヘルプ</li>
            </ul>
            <button onclick="this.parentElement.parentElement.remove()">閉じる</button>
        </div>
    `;
    
    document.body.appendChild(helpModal);
    
    // 3秒後に自動で閉じる
    setTimeout(() => {
        if (helpModal.parentElement) {
            helpModal.remove();
        }
    }, 3000);
}

// イベントリスナーの追加
Reveal.on('slidechanged', handleSlideAnimations);
Reveal.on('ready', () => {
    setupKeyboardShortcuts();
    initInteractiveElements();
});

// デバッグ用（開発時のみ）
if (window.location.hostname === 'localhost') {
    window.revealDebug = {
        getCurrentSlideInfo,
        getPresentationStats,
        addSlideClass,
        reveal: Reveal,
        initInteractiveElements,
        showHelp
    };
    
    console.log('デバッグ機能が利用可能です: window.revealDebug');
    console.log('ヘルプを表示するには "h" キーを押してください');
}