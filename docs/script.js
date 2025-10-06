class WheelOfFortune {
    constructor() {
        this.canvas = document.getElementById('wheelCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.spinButton = document.getElementById('spinButton');
        this.ticketCounter = document.getElementById('ticketCounter');
        this.modal = document.getElementById('resultModal');
        this.prizeText = document.getElementById('prizeText');
        this.shareButton = document.getElementById('shareButton');
        this.copyButton = document.getElementById('copyButton');
        this.closeModal = document.getElementById('closeModal');
        
        // Настройки призов
        this.prizes = [
            { name: "10-50 рай коинов", probability: 60, color: "#FF6B6B", type: "coins" },
            { name: "Поцелуй от Рай райского", probability: 20, color: "#4ECDC4", type: "kiss" },
            { name: "Новый спин билет", probability: 10, color: "#45B7D1", type: "ticket" },
            { name: "Бутыль пива", probability: 5, color: "#FFD166", type: "beer" },
            { name: "Поездка на Пхукет", probability: 5, color: "#9B5DE5", type: "trip" }
        ];
        
        this.isSpinning = false;
        this.rotation = 0;
        this.tickets = this.getTickets();
        
        this.init();
    }
    
    init() {
        this.drawWheel();
        this.setupEventListeners();
        this.updateTicketDisplay();
        this.initTelegram();
    }
    
    initTelegram() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
    }
    
    getTickets() {
        const saved = localStorage.getItem('spinTickets');
        return saved ? parseInt(saved) : 3; // Начальные 3 билета для тестирования
    }
    
    saveTickets(tickets) {
        this.tickets = tickets;
        localStorage.setItem('spinTickets', tickets.toString());
    }
    
    updateTicketDisplay() {
        this.ticketCounter.textContent = this.tickets;
        this.spinButton.disabled = this.tickets <= 0 || this.isSpinning;
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
            
            // Рисуем сегмент колеса
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = prize.color;
            this.ctx.fill();
            this.ctx.stroke();
            
            // Рисуем текст
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = 'white';
            this.ctx.font = 'bold 12px Arial';
            this.ctx.fillText(prize.name, radius - 15, 0);
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
        this.spinButton.addEventListener('click', () => this.spin());
        this.closeModal.addEventListener('click', () => this.hideModal());
        this.shareButton.addEventListener('click', () => this.shareReferral());
        this.copyButton.addEventListener('click', () => this.copyReferral());
        
        // Закрытие модального окна при клике вне его
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) {
                this.hideModal();
            }
        });
    }
    
    spin() {
        if (this.isSpinning || this.tickets <= 0) return;
        
        this.isSpinning = true;
        this.spinButton.disabled = true;
        
        // Используем билет
        this.saveTickets(this.tickets - 1);
        this.updateTicketDisplay();
        
        // Выбираем случайный приз на основе вероятностей
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
        
        // Анимация вращения
        this.animateSpin(winningPrize);
    }
    
    animateSpin(winningPrize) {
        const spinDuration = 3000; // 3 секунды
        const startTime = performance.now();
        const startRotation = this.rotation;
        
        // Дополнительные вращения + позиция выигрышного приза
        const extraRotations = 5; // 5 полных оборотов
        const winningIndex = this.prizes.indexOf(winningPrize);
        const totalProbability = this.prizes.reduce((sum, prize) => sum + prize.probability, 0);
        
        // Вычисляем угол для выигрышного приза
        let prizeStartAngle = 0;
        for (let i = 0; i < winningIndex; i++) {
            prizeStartAngle += (2 * Math.PI * this.prizes[i].probability) / totalProbability;
        }
        const prizeAngle = prizeStartAngle + (Math.PI * this.prizes[winningIndex].probability) / totalProbability;
        
        const targetRotation = extraRotations * 2 * Math.PI + (2 * Math.PI - prizeAngle);
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / spinDuration, 1);
            
            // Эффект замедления (easing)
            const easeOut = (t) => 1 - Math.pow(1 - t, 3);
            const easedProgress = easeOut(progress);
            
            this.rotation = startRotation + (targetRotation - startRotation) * easedProgress;
            
            // Перерисовываем колесо с новым вращением
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
                this.updateTicketDisplay();
                setTimeout(() => this.showPrize(winningPrize), 500);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    showPrize(prize) {
        let prizeMessage = '';
        let additionalAction = null;
        
        switch(prize.type) {
            case 'coins':
                const coins = Math.floor(Math.random() * 41) + 10; // 10-50 coins
                prizeMessage = `🎉 Вы выиграли ${coins} рай коинов!`;
                this.addCoins(coins);
                break;
            case 'ticket':
                prizeMessage = '🎫 Вы выиграли дополнительный спин-билет!';
                this.saveTickets(this.tickets + 1);
                this.updateTicketDisplay();
                break;
            case 'kiss':
                prizeMessage = '💋 Вы выиграли поцелуй от Рай райского!';
                break;
            case 'beer':
                prizeMessage = '🍺 Вы выиграли бутыль пива!';
                break;
            case 'trip':
                prizeMessage = '✈️ Вы выиграли поездку на Пхукет!';
                break;
        }
        
        this.prizeText.textContent = prizeMessage;
        this.showModal();
    }
    
    showModal() {
        this.modal.style.display = 'flex';
    }
    
    hideModal() {
        this.modal.style.display = 'none';
    }
    
    addCoins(amount) {
        const currentCoins = parseInt(localStorage.getItem('raiCoins')) || 0;
        localStorage.setItem('raiCoins', (currentCoins + amount).toString());
    }
    
    shareReferral() {
        const referralLink = this.generateReferralLink();
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.shareUrl(referralLink, 'Присоединяйся к колесу фортуны! Крути и выигрывай призы! 🎰');
        } else {
            // Fallback для браузера
            if (navigator.share) {
                navigator.share({
                    title: 'Колесо Фортуны',
                    text: 'Присоединяйся к колесу фортуны!',
                    url: referralLink,
                });
            } else {
                alert(`Поделитесь этой ссылкой: ${referralLink}`);
            }
        }
    }
    
    copyReferral() {
        const referralLink = this.generateReferralLink();
        navigator.clipboard.writeText(referralLink).then(() => {
            alert('Ссылка скопирована в буфер обмена!');
        }).catch(() => {
            // Fallback для старых браузеров
            const textArea = document.createElement('textarea');
            textArea.value = referralLink;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            alert('Ссылка скопирована!');
        });
    }
    
    generateReferralLink() {
        // В реальном приложении это была бы правильная реферальная система
        const userId = localStorage.getItem('tgUserId') || 'demo_user';
        return `https://t.me/your_bot?start=ref_${userId}`;
    }
}

// Инициализация приложения когда DOM загружен
document.addEventListener('DOMContentLoaded', () => {
    new WheelOfFortune();
});
