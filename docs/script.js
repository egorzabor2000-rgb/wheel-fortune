class WheelOfFortune {
    constructor() {
        this.canvas = document.getElementById('wheel');
        this.ctx = this.canvas.getContext('2d');
        this.spinBtn = document.getElementById('spin-btn');
        this.ticketCount = document.getElementById('ticket-count');
        this.modal = document.getElementById('result-modal');
        this.prizeText = document.getElementById('prize-text');
        
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
        this.updateTicketDisplay();
        
        this.init();
    }
    
    init() {
        this.drawWheel();
        this.setupEventListeners();
        this.initTelegram();
    }
    
    initTelegram() {
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.ready();
            Telegram.WebApp.expand();
        }
    }
    
    getTickets() {
        return parseInt(localStorage.getItem('spinTickets')) || 0;
    }
    
    saveTickets(tickets) {
        this.tickets = tickets;
        localStorage.setItem('spinTickets', tickets.toString());
    }
    
    updateTicketDisplay() {
        this.ticketCount.textContent = this.tickets;
        this.spinBtn.disabled = this.tickets <= 0 || this.isSpinning;
    }
    
    drawWheel() {
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const radius = this.canvas.width / 2 - 10;
        
        let startAngle = 0;
        
        this.prizes.forEach((prize, index) => {
            const sliceAngle = (2 * Math.PI * prize.probability) / 100;
            const endAngle = startAngle + sliceAngle;
            
            // Draw slice
            this.ctx.beginPath();
            this.ctx.moveTo(centerX, centerY);
            this.ctx.arc(centerX, centerY, radius, startAngle, endAngle);
            this.ctx.closePath();
            this.ctx.fillStyle = prize.color;
            this.ctx.fill();
            
            // Draw text
            this.ctx.save();
            this.ctx.translate(centerX, centerY);
            this.ctx.rotate(startAngle + sliceAngle / 2);
            this.ctx.textAlign = 'right';
            this.ctx.fillStyle = 'white';
            this.ctx.font = '12px Arial';
            this.ctx.fillText(prize.name.substring(0, 10) + '...', radius - 20, 0);
            this.ctx.restore();
            
            startAngle = endAngle;
        });
    }
    
    setupEventListeners() {
        this.spinBtn.addEventListener('click', () => this.spin());
        
        document.getElementById('close-modal').addEventListener('click', () => {
            this.modal.classList.add('hidden');
        });
        
        document.getElementById('share-btn').addEventListener('click', () => {
            this.shareReferral();
        });
        
        document.getElementById('copy-btn').addEventListener('click', () => {
            this.copyReferral();
        });
    }
    
    spin() {
        if (this.isSpinning || this.tickets <= 0) return;
        
        this.isSpinning = true;
        this.spinBtn.disabled = true;
        
        // Use ticket
        this.saveTickets(this.tickets - 1);
        this.updateTicketDisplay();
        
        // Generate random prize based on probability
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
        
        // Calculate rotation for animation
        const extraRotation = 5 * 360; // 5 full extra rotations
        const prizeIndex = this.prizes.indexOf(winningPrize);
        const sliceAngle = (2 * Math.PI) / this.prizes.length;
        const targetAngle = prizeIndex * sliceAngle + Math.random() * sliceAngle;
        
        const targetRotation = extraRotation + (360 - (targetAngle * 180 / Math.PI) % 360);
        
        // Animate spin
        this.animateSpin(targetRotation, winningPrize);
    }
    
    animateSpin(targetRotation, prize) {
        const duration = 3000;
        const startRotation = this.rotation;
        const startTime = performance.now();
        
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function
            const easeOut = (t) => 1 - Math.pow(1 - t, 3);
            
            this.rotation = startRotation + (targetRotation - startRotation) * easeOut(progress);
            
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.save();
            this.ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
            this.ctx.rotate(this.rotation * Math.PI / 180);
            this.ctx.translate(-this.canvas.width / 2, -this.canvas.height / 2);
            this.drawWheel();
            this.ctx.restore();
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                this.isSpinning = false;
                this.updateTicketDisplay();
                this.showPrize(prize);
            }
        };
        
        requestAnimationFrame(animate);
    }
    
    showPrize(prize) {
        let prizeMessage = '';
        
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
        this.modal.classList.remove('hidden');
    }
    
    addCoins(amount) {
        const currentCoins = parseInt(localStorage.getItem('raiCoins')) || 0;
        localStorage.setItem('raiCoins', (currentCoins + amount).toString());
    }
    
    shareReferral() {
        const referralLink = this.generateReferralLink();
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.shareUrl(referralLink, 'Присоединяйся к колесу фортуны!');
        } else {
            // Fallback for browser testing
            alert(`Поделитесь этой ссылкой: ${referralLink}`);
        }
    }
    
    copyReferral() {
        const referralLink = this.generateReferralLink();
        navigator.clipboard.writeText(referralLink).then(() => {
            alert('Ссылка скопирована в буфер обмена!');
        });
    }
    
    generateReferralLink() {
        // In a real app, this would be a proper referral system
        const userId = localStorage.getItem('tgUserId') || 'demo_user';
        return `https://t.me/your_bot?start=ref_${userId}`;
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WheelOfFortune();
});

// Add some demo tickets for testing
localStorage.setItem('spinTickets', '3');
