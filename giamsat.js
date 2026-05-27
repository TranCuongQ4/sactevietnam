// Hệ thống giám sát luật chơi, chấm điểm các vòng và đồng bộ tài chính lưu trữ Storage
const GiamSatModule = {
    STORAGE_KEY: "Sắc_Tê_Tran_Cuong_Data",

    // Tải thông tin số dư tài khoản của các đấu thủ từ LocalStorage
    docViTien: function() {
        let macDinh = { south: 2000, east: 2000, north: 2000, west: 2000 };
        let data = localStorage.getItem(this.STORAGE_KEY);
        if (data) {
            try { return JSON.parse(data); } catch(e) { return macDinh; }
        }
        return macDinh;
    },

    // Ghi nhận và lưu trữ số dư mới vào LocalStorage
    capNhatViTien: function(viTien) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(viTien));
    },

    // Phân tích tìm ra lá bài chiến thắng của một vòng đấu cụ thể
    xetThangVong: function(playedCards, targetSuit) {
        // playedCards là mảng chứa: { playerId, card }
        let winPlay = null;
        
        for (let play of playedCards) {
            if (play.card && play.card.suit === targetSuit) {
                if (!winPlay || play.card.weight > winPlay.card.weight) {
                    winPlay = play;
                }
            }
        }
        return winPlay; // Trả về { playerId, card } lớn nhất hợp lệ
    },

    // Kiểm tra danh sách những người bị Chết Tùng sau vòng 4
    kiemTraGucTung: function(roundWinners) {
        // roundWinners: Mảng lưu trữ ID người thắng từ vòng 1 đến vòng 4
        let players = ['south', 'west', 'north', 'east'];
        let gucTungList = {};
        
        players.forEach(p => {
            // Nếu không thắng bất kỳ một vòng nào trong 4 vòng đầu -> Chết Tùng
            let coThangVong = roundWinners.some(winnerId => winnerId === p);
            gucTungList[p] = !coThangVong;
        });
        
        return gucTungList;
    }
};