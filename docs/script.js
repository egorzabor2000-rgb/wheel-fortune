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
            friendsInvited: 0
        };
        
        this.init();
    }
    
    init() {
        this.loadUserData();
        this.initWheel();
        this.setupEventListeners();
        this.initTelegram();
        this.updateUI();
    }
    
    loadUserData() {
        // Загрузка данных из localStorage
        const savedCoins = localStorage.getItem('raiCoins');
        const savedTickets = localStorage.getItem('spinTickets');
        const savedPurchased = localStorage.getItem('purchasedTickets');
        const savedStats = localStorage.getItem('userStats');
        
        if (savedCoins) this.coinBalance = parseInt(savedCoins);
        if (savedTickets) this.ticketBalance = parseInt(savedTickets);
        if (savedPurchased) this.purchasedTickets = JSON.parse(savedPurchased);
        if (savedStats) this.userStats = JSON.parse(savedStats);
    }
    
    saveUserData() {
        localStorage.setItem('raiCoins', this.coinBalance.toString());
        localStorage.setItem('spinTickets', this.ticketBalance.toString());
        localStorage.setItem('purchasedTickets', JSON.stringify(this.purchasedTickets));
        localStorage.setItem('userStats', JSON.stringify(this.userStats));
    }
    
    initWheel() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.spinButton = document.getElementById('spinButton');
        this.isSpinning = false;
        this.rotation = 0;
        
        this.prizes = [
            { name: "10-50 рай коинов", probability: 60, color: "#FF6B6B", type: "coins" },
            { name: "Поцелуй от Рай райского", probability: 20, color: "#4ECDC4", type: "kiss" },
            { name: "Новый спин билет", probability: 10, color: "#45B7D1", type: "ticket" },
            { name: "Бутыль пива", probability: 5, color: "#FFD166", type: "beer" },
            { name: "Поездка на Пхукет", probability: 5, color: "#9B5DE5", type: "trip" }
        ];
        
        this.drawWheel();
    }
    
    drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = this.canvas.width / 2 - 10;
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        let startAngle = 0;
        const totalProbability = this.prizes.reduce((sum, prize) => sum + prize.probability, 0);
        
        this.prizes.forEach((prize, index) => {
            const sliceAngle = (2 * Math.PI * prize.probability) / totalProbability;
            const endAngle = startAngle + sliceAngle;
            
            // Рисуем сегмент
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = prize.color;
            this.ctx.fill();
            this.ctx.stroke();
            
            // Текст
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 10px Arial';
            this.ctx.fillText(prize.name.substring(0, 8) + '...', radius - 15, 0);
            this.ctx.restore();
            
            startAngle = endAngle;
        });
        
        // Центральный круг
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
        this.ctx.strokeStyle = '#ddd';
        this.ctx.stroke();
    }
    
    setupEventListeners() {
        // Вкладки
        document.querySelectorAll('.tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchTab(e.target.dataset.tab);
            });
        });
        
        // Колесо
        this.spinButton.addEventListener('click', () => this.spinWheel());
        
        // Покупка билетов
        document.querySelectorAll('.buy-ticket-btn').forEach(button => {
            button.addEventListener('click', (e) => {
                const event = e.target.dataset.event;
                const cost = parseInt(e.target.dataset.cost);
                this.showPurchaseModal(event, cost);
            });
        });
        
        // Модальные окна
        document.getElementById('closeModal').addEventListener('click', () => this.hideModal('resultModal'));
        document.getElementById('confirmPurchase').addEventListener('click', () => this.confirmPurchase());
        document.getElementById('cancelPurchase').addEventListener('click', () => this.hideModal('purchaseModal'));
        
        // Реферальная система
        document.getElementById('shareButton').addEventListener('click', () => this.shareReferral());
        document.getElementById('copyButton').addEventListener('click', () => this.copyReferral());
        
        // Закрытие модалок по клику вне
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    this.hideModal(modal.id);
                }
            });
        });
    }
    
    switchTab(tabName) {
        this.currentTab = tabName;
        
        // Обновляем активные кнопки
        document.querySelectorAll('.tab-button').forEach(button => {
            button.classList.toggle('active', button.dataset.tab === tabName);
        });
        
        // Показываем активную вкладку
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.toggle('active', content.id === `${tabName}-tab`);
        });
    }
    
    spinWheel() {
        if (this.isSpinning || this.ticketBalance <= 0) return;
        
        this.isSpinning = true;
        this.spinButton.disabled = true;
        
        // Используем билет
        this.ticketBalance--;
        this.userStats.totalSpins++;
        this.updateUI();
        
        // Выбираем приз
        const random = Math.random() * 100;
        let accumulatedProb = 0;
        let winningPrize = null;
        
        for (const prize of this.prizes) {
            accumulatedProb += prize.probability;
            if (random <= accumulatedProb) {
                winningPrize = prize;
                break;
            }
        }
        
        this.animateSpin(winningPrize);
    }
    
    animateSpin(winningPrize) {
        const spinDuration = 3000;
        const startTime = performance.now();
        const startRotation = this.rotation;
        
        const extraRotations = 5;
        const winningIndex = this.prizes.indexOf(winningPrize);
        const totalProbability = this.prizes.reduce((sum, prize) => sum + prize.probability, 0);
        
        let prizeStartAngle = 0;
        for (let i = 0; i < winningIndex; i++) {
            prizeStartAngle += (2 * Math.PI * this.prizes[i].probability) / totalProbability;
        }
        const prizeAngle = prizeStartAngle + (Math.PI * this.prizes[winningIndex].probability) / totalProbability;
        
        const targetRotation = extraRotations * 2 * Math.PI + (2 * Math.PI - prizeAngle);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            const easeOut = (t) => 1 - Math.pow(1 - t, 3);
            const easedProgress = easeOut(progress);
            
            this.rotation = startRotation + (targetRotation - startRotation) * easedProgress;
            
            this.ctx.save();
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.rotate(this.rotation);
            this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
            this.drawWheel();
            this.ctx.restore();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                this.processPrize(winningPrize);
                this.updateUI();
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    processPrize(prize) {
        let message = '';
        
        switch(prize.type) {
            case 'coins':
                const coins = Math.floor(Math.random() * 41) + 10;
                this.coinBalance += coins;
                this.userStats.totalCoinsWon += coins;
                message = `🎉 Вы выиграли ${coins} рай коинов!`;
                break;
            case 'ticket':
                this.ticketBalance++;
                message = '🎫 Вы выиграли дополнительный спин-билет!';
                break;
            case 'kiss':
                message = '💋 Вы выиграли поцелуй от Рай райского!';
                break;
            case 'beer':
                message = '🍺 Вы выиграли бутыль пива!';
                break;
            case 'trip':
                message = '✈️ Вы выиграли поездку на Пхукет!';
                break;
        }
        
        this.saveUserData();
        this.showResultModal(message);
    }
    
    showPurchaseModal(event, cost) {
        this.currentPurchase = { event, cost };
        
        const eventNames = {
            beer: 'розыгрыш пива',
            massage: 'розыгрыш массажа', 
            sauna: 'розыгрыш парения',
            iphone: 'розыгрыш iPhone 17 Pro'
        };
        
        document.getElementById('purchaseText').textContent = 
            `Вы хотите купить билет на ${eventNames[event]} за ${cost.toLocaleString()} рай коинов?`;
        
        this.showModal('purchaseModal');
    }
    
    confirmPurchase() {
        const { event, cost } = this.currentPurchase;
        
        if (this.coinBalance >= cost) {
            this.coinBalance -= cost;
            this.purchasedTickets[event]++;
            this.saveUserData();
            this.updateUI();
            
            this.hideModal('purchaseModal');
            this.showResultModal(`🎫 Вы успешно купили билет на розыгрыш!`);
        } else {
            this.hideModal('purchaseModal');
            this.showResultModal('❌ Недостаточно рай коинов для покупки билета');
        }
    }
    
    showResultModal(message) {
        document.getElementById('prizeText').textContent = message;
        this.showModal('resultModal');
    }
    
    showModal(modalId) {
        document.getElementById(modalId).style.display = 'flex';
    }
    
    hideModal(modalId) {
        document.getElementById(modalId).style.display = 'none';
    }
    
    updateUI() {
        // Баланс
        document.getElementById('ticketCount').textContent = this.ticketBalance;
        document.getElementById('coinBalance').textContent = this.coinBalance.toLocaleString();
        
        // Статистика
        document.getElementById('totalSpins').textContent = this.userStats.totalSpins;
        document.getElementById('totalCoinsWon').textContent = this.userStats.totalCoinsWon.toLocaleString();
        document.getElementById('friendsInvited').textContent = this.userStats.friendsInvited;
        
        // Купленные билеты
        document.getElementById('beerTickets').textContent = this.purchasedTickets.beer;
        document.getElementById('massageTickets').textContent = this.purchasedTickets.massage;
        document.getElementById('saunaTickets').textContent = this.purchasedTickets.sauna;
        document.getElementById('iphoneTickets').textContent = this.purchasedTickets.iphone;
        
        // Инвентарь
        document.getElementById('inventoryBeer').textContent = this.purchasedTickets.beer;
        document.getElementById('inventoryMassage').textContent = this.purchasedTickets.massage;
        document.getElementById('inventorySauna').textContent = this.purchasedTickets.sauna;
        document.getElementById('inventoryIphone').textContent = this.purchasedTickets.iphone;
        
        // Кнопка вращения
        this.spinButton.disabled = this.ticketBalance <= 0 || this.isSpinning;
    }
    
    initTelegram() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
    }
    
    shareReferral() {
        const referralLink = this.generateReferralLink();
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.shareUrl(referralLink, 'Присоединяйся к Rai Paradise! Крути колесо и выигрывай призы! 🎰');
        } else {
            alert(`Поделитесь ссылкой: ${referralLink}`);
        }
    }
    
    copyReferral() {
        const referralLink = this.generateReferralLink();
        navigator.clipboard.writeText(referralLink).then(() => {
            alert('Реферальная ссылка скопирована!');
        });
    }
    
    generateReferralLink() {
        return `https://t.me/your_bot?start=ref_${Date.now()}`;
    }
    
    // Метод для начисления бонусов за приглашенных друзей
    addReferralBonus() {
        this.ticketBalance += 3;
        this.coinBalance += 50;
        this.userStats.friendsInvited++;
        this.saveUserData();
        this.updateUI();
        this.showResultModal('🎉 Бонус за приглашенного друга: 3 билета + 50 рай коинов!');
    }
}

// Инициализация приложения
document.addEventListener('DOMContentLoaded', () => {
    window.raiApp = new RaiParadiseApp();
});
