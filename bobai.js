// Quản lý dữ liệu cấu trúc và thiết kế hiển thị của bộ bài chuẩn 52 lá
const BoBaiModule = {
    suits: [
        { id: 'co', char: '♥', colorClass: 'text-red' },
        { id: 'ro', char: '♦', colorClass: 'text-red' },
        { id: 'chuon', char: '♣', colorClass: 'text-black' },
        { id: 'bich', char: '♠', colorClass: 'text-black' }
    ],
    values: ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'],

    // Khởi tạo mảng 52 lá bài gốc chuẩn quốc tế
    taoBoBaiMoi: function() {
        let deck = [];
        for (let s = 0; s < this.suits.length; s++) {
            for (let v = 0; v < this.values.length; v++) {
                deck.push({
                    id: `${this.values[v]}_${this.suits[s].id}`,
                    value: this.values[v],
                    suit: this.suits[s].id,
                    suitChar: this.suits[s].char,
                    colorClass: this.suits[s].colorClass,
                    weight: v // Trọng số từ 0 (lá 2) đến 12 (lá A) để so sánh lớn nhỏ
                });
            }
        }
        return deck;
    },

    // Trộn bài ngẫu nhiên danh tiếng
    xaoBai: function(deck) {
        for (let i = deck.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [deck[i], deck[j]] = [deck[j], deck[i]];
        }
        return deck;
    },

    // Hàm xuất mã HTML thiết kế trực tiếp giao diện lá bài dựa trên yêu cầu cấu trúc matmo/matup
    renderCardHTML: function(card, isOpen) {
        if (isOpen) {
            // Thiết kế dạng matmo.png: Nước góc trái trên, số to đậm thẳng đứng lệch góc dưới phải
            return `
                <div class="card-base card-face" data-card-id="${card.id}">
                    <span class="card-suit-top ${card.colorClass}">${card.suitChar}</span>
                    <span class="card-value-main ${card.colorClass}">${card.value}</span>
                </div>
            `;
        } else {
            // Thiết kế dạng matup.png
            return `<div class="card-base card-back" data-card-id="${card.id}"></div>`;
        }
    }
};