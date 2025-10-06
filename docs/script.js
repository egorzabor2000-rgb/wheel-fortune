class RaiParadiseApp {
    constructor() {
        this.currentTab = 'wheel';
        this.coinBalance = 0;
        this.ticketBalance = 3;
        this.purchasedTickets = {
            beer: 0,
            massage: 0,
            sauna: 0,
            iphone: 0
        };
        this.userStats = {
            totalSpins: 0,
            totalCoinsWon: 0,
            friendsInvited: 0,
            tasksCompleted: 0
        };
        
        // Состояние выполненных заданий
        this.completedTasks = {
            telegram: false,
            instagram: false,
            video: false,
            invite: false,
            warmup: false
        };
        
        // Прогресс по прогрева-гайду
        this.warmupProgress = {
            block1: Array(4).fill(false), // 4 видео в блоке 1
            block2: Array(4).fill(false), // 4 видео в блоке 2  
            block3: Array(4).fill(false), // 4 видео в блоке 3
            block4: Array(4).fill(false)  // 4 видео в блоке 4
        };
        
        // Реферальная статистика
        this.referralStats = {
            totalReferrals: 0,
            earnedTickets: 0,
            earnedCoins: 0
        };
        
        this.init();
    }
    
    init() {
        this.loadUserData();
        this.initWheel();
        this.setupEventListeners();
        this.initTelegram();
        this.updateUI();
        this.updateWarmupProgress();
    }
    
    loadUserData() {
        const savedCoins = localStorage.getItem('raiCoins');
        const savedTickets = localStorage.getItem('spinTickets');
        const savedPurchased = localStorage.getItem('purchasedTickets');
        const savedStats = localStorage.getItem('userStats');
        const savedTasks = localStorage.getItem('completedTasks');
        const savedWarmup = localStorage.getItem('warmupProgress');
        const savedReferral = localStorage.getItem('referralStats');
        
        if (savedCoins) this.coinBalance = parseInt(savedCoins);
        if (savedTickets) this.ticketBalance = parseInt(savedTickets);
        if (savedPurchased) this.purchasedTickets = JSON.parse(savedPurchased);
        if (savedStats) this.userStats = JSON.parse(savedStats);
        if (savedTasks) this.completedTasks = JSON.parse(savedTasks);
        if (savedWarmup) this.warmupProgress = JSON.parse(savedWarmup);
        if (savedReferral) this.referralStats = JSON.parse(savedReferral);
    }
    
    saveUserData() {
        localStorage.setItem('raiCoins', this.coinBalance.toString());
        localStorage.setItem('spinTickets', this.ticketBalance.toString());
        localStorage.setItem('purchasedTickets', JSON.stringify(this.purchasedTickets));
        localStorage.setItem('userStats', JSON.stringify(this.userStats));
        localStorage.setItem('completedTasks', JSON.stringify(this.completedTasks));
        localStorage.setItem('warmupProgress', JSON.stringify(this.warmupProgress));
        localStorage.setItem('referralStats', JSON.stringify(this.referralStats));
    }
    
    initWheel() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.spinButton = document.getElementById('spinButton');
        this.isSpinning = false;
        this.rotation = 0;
        
        this.prizes = [
            { name: "Рай коины", probability: 60, color: "#FF6B6B", type: "coins" },
            { name: "Поцелуй от Рай", probability: 20, color: "#4ECDC4", type: "kiss" },
            { name: "Доп. спин", probability: 10, color: "#45B7D1", type: "ticket" },
            { name: "Бутыль пива", probability: 5, color: "#FFD166", type: "beer" },
            { name: "Поездка на Пхукет", probability: 5, color: "#9B5DE5", type: "trip" }
        ];
        
        this.drawWheel();
    }
    
    // ... (остальные методы остаются такими же до раздела СИСТЕМА ЗАДАНИЙ)
    
    // СИСТЕМА ПРОГРЕВА-ГАЙДА
    openWarmupGuide() {
        if (this.completedTasks.warmup) {
            this.showResultModal('✅ Вы уже завершили прогрев-гайд!');
            return;
        }
        
        this.showModal('warmupModal');
        this.updateWarmupUI();
    }
    
    watchVideo(blockNumber, videoNumber) {
        if (this.completedTasks.warmup) return;
        
        const blockKey = `block${blockNumber}`;
        const videoIndex = videoNumber - 1;
        
        // Помечаем видео как просмотренное
        if (!this.warmupProgress[blockKey][videoIndex]) {
            this.warmupProgress[blockKey][videoIndex] = true;
            this.saveUserData();
            this.updateWarmupUI();
            this.updateWarmupProgress();
            
            // Проверяем, завершен ли блок
            this.checkBlockCompletion(blockNumber);
            
            // Проверяем, завершен ли весь гайд
            this.checkWarmupCompletion();
        }
    }
    
    checkBlockCompletion(blockNumber) {
        const blockKey = `block${blockNumber}`;
        const isBlockComplete = this.warmupProgress[blockKey].every(video => video === true);
        
        if (isBlockComplete) {
            // Вознаграждение за завершение блока
            this.ticketBalance += 2;
            this.coinBalance += 200;
            this.saveUserData();
            this.updateUI();
            
            this.showResultModal(`🎉 Блок ${blockNumber} завершен! Получено: 2 спин-билета + 200 рай коинов`);
        }
    }
    
    checkWarmupCompletion() {
        // Проверяем, все ли блоки завершены
        const allBlocksComplete = [1, 2, 3, 4].every(blockNumber => {
            const blockKey = `block${blockNumber}`;
            return this.warmupProgress[blockKey].every(video => video === true);
        });
        
        if (allBlocksComplete && !this.completedTasks.warmup) {
            this.completeWarmup();
        }
    }
    
    completeWarmup() {
        // Основное вознаграждение за весь гайд
        this.ticketBalance += 10;
        this.coinBalance += 1000;
        this.completedTasks.warmup = true;
        this.userStats.tasksCompleted++;
        
        this.saveUserData();
        this.updateUI();
        this.updateTaskButtons();
        
        this.showResultModal('🎉 Поздравляем! Вы завершили прогрев-гайд и получили 10 спин-билетов и 1000 рай коинов!');
        this.hideModal('warmupModal');
    }
    
    updateWarmupUI() {
        // Обновляем состояние кнопок просмотра в модальном окне
        for (let blockNumber = 1; blockNumber <= 4; blockNumber++) {
            const blockKey = `block${blockNumber}`;
            const blockElement = document.querySelector(`.warmup-block[data-block="${blockNumber}"]`);
            
            if (blockElement) {
                this.warmupProgress[blockKey].forEach((isWatched, videoIndex) => {
                    const videoElement = blockElement.querySelector(`.video-item[data-video="${videoIndex + 1}"]`);
                    const watchButton = videoElement.querySelector('.watch-btn');
                    
                    if (isWatched) {
                        videoElement.classList.add('watched');
                        watchButton.textContent = '✅ Просмотрено';
                        watchButton.disabled = true;
                        watchButton.classList.add('completed');
                    }
                });
            }
        }
    }
    
    updateWarmupProgress() {
        // Обновляем прогресс-бары на главной странице
        let completedBlocks = 0;
        
        for (let blockNumber = 1; blockNumber <= 4; blockNumber++) {
            const blockKey = `block${blockNumber}`;
            const watchedVideos = this.warmupProgress[blockKey].filter(video => video).length;
            const progressPercentage = (watchedVideos / 4) * 100;
            
            // Обновляем прогресс-бар
            const progressFill = document.querySelector(`.progress-block[data-block="${blockNumber}"] .progress-fill`);
            if (progressFill) {
                progressFill.style.width = `${progressPercentage}%`;
                progressFill.setAttribute('data-progress', watchedVideos);
            }
            
            if (watchedVideos === 4) {
                completedBlocks++;
            }
        }
        
        // Обновляем общий прогресс
        document.getElementById('warmupProgress').textContent = `${completedBlocks}/4`;
    }
    
    // УЛУЧШЕННАЯ РЕФЕРАЛЬНАЯ СИСТЕМА
    shareReferral() {
        const referralLink = this.generateReferralLink();
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.shareUrl(referralLink, 
                'Присоединяйся к Rai Paradise! 🎰\n\n' +
                '🎫 Крути колесо и выигрывай призы\n' +
                '🪙 Зарабатывай рай коины\n' +
                '🎁 Участвуй в розыгрышах\n' +
                '🔥 Знакомься с уникальным лором\n\n' +
                'Переходи по ссылке и начни свой путь!'
            );
        } else {
            // Fallback для браузера
            const shareText = `Присоединяйся к Rai Paradise! 🎰

🎫 Крути колесо и выигрывай призы
🪙 Зарабатывай рай коины  
🎁 Участвуй в розыгрышах
🔥 Знакомься с уникальным лором

Переходи по ссылке: ${referralLink}`;

            if (navigator.share) {
                navigator.share({
                    title: 'Rai Paradise - Колесо Фортуны',
                    text: shareText,
                    url: referralLink,
                });
            } else {
                alert(shareText);
            }
        }
        
        // Отмечаем задание "пригласить друга" как выполненное
        if (!this.completedTasks.invite) {
            this.completeTask('invite');
        }
    }
    
    copyReferral() {
        const referralLink = this.generateReferralLink();
        const shareText = `Присоединяйся к Rai Paradise! 🎰

🎫 Крути колесо и выигрывай призы
🪙 Зарабатывай рай коины  
🎁 Участвуй в розыгрышах
🔥 Знакомься с уникальным лором

Переходи по ссылке: ${referralLink}`;

        navigator.clipboard.writeText(shareText).then(() => {
            this.showResultModal('📋 Реферальное сообщение скопировано в буфер обмена!');
        }).catch(() => {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = shareText;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            this.showResultModal('📋 Реферальное сообщение скопировано!');
        });
        
        // Отмечаем задание "пригласить друга" как выполненное
        if (!this.completedTasks.invite) {
            this.completeTask('invite');
        }
    }
    
    generateReferralLink() {
        // Генерируем уникальную реферальную ссылку
        const userId = this.generateUserId();
        return `https://t.me/your_bot?start=ref_${userId}`;
    }
    
    generateUserId() {
        // Генерируем или получаем ID пользователя
        let userId = localStorage.getItem('userId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('userId', userId);
        }
        return userId;
    }
    
    // Метод для обработки реферального бонуса (вызывается когда кто-то переходит по ссылке)
    addReferralBonus() {
        this.ticketBalance += 3;
        this.coinBalance += 50;
        this.referralStats.totalReferrals++;
        this.referralStats.earnedTickets += 3;
        this.referralStats.earnedCoins += 50;
        this.userStats.friendsInvited++;
        
        this.saveUserData();
        this.updateUI();
        this.updateReferralStats();
        
        this.showResultModal('🎉 Бонус за приглашенного друга: 3 билета + 50 рай коинов!');
    }
    
    updateReferralStats() {
        // Обновляем статистику реферальной программы
        document.getElementById('referralCount').textContent = this.referralStats.totalReferrals;
        document.getElementById('referralEarned').textContent = this.referralStats.earnedCoins;
        
        document.getElementById('profileReferralCount').textContent = this.referralStats.totalReferrals;
        document.getElementById('profileReferralTickets').textContent = this.referralStats.earnedTickets;
        document.getElementById('profileReferralCoins').textContent = this.referralStats.earnedCoins;
    }
    
    // СИСТЕМА ЗАДАНИЙ
    completeTask(taskId) {
        if (this.completedTasks[taskId]) {
            this.showResultModal('❌ Это задание уже выполнено!');
            return;
        }
        
        // Награда за задание
        this.ticketBalance += 3;
        this.coinBalance += 50;
        this.completedTasks[taskId] = true;
        this.userStats.tasksCompleted++;
        
        this.saveUserData();
        this.updateUI();
        this.updateTaskButtons();
        
        this.showResultModal('🎉 Задание выполнено! Получено: 3 спин-билета + 50 рай коинов');
    }
    
    updateTaskButtons() {
        // Обновляем состояние кнопок заданий
        Object.keys(this.completedTasks).forEach(taskId => {
            const button = document.querySelector(`[data-task="${taskId}"]`);
            if (button) {
                if (this.completedTasks[taskId]) {
                    button.textContent = '✅ Выполнено';
                    button.disabled = true;
                    button.classList.add('completed');
                } else {
                    button.disabled = false;
                    button.classList.remove('completed');
                }
            }
        });
    }
    
    // ... (остальные методы остаются без изменений)
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.raiApp = new RaiParadiseApp();
    
    // Обработчик закрытия модального окна прогрева
    document.getElementById('closeWarmupModal').addEventListener('click', () => {
        window.raiApp.hideModal('warmupModal');
    });
});
