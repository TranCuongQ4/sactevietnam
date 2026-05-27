/**
 * Hệ thống Trí tuệ nhân tạo BotSacteAI - Điều khiển tư duy chiến thuật cho Bot Đông, Tây, Bắc
 * Áp dụng mô hình định giá trạng thái Minimax để tối ưu hóa việc quản lý tài nguyên bài.
 */
const BotSacteAI = {
    /**
     * Hàm điều hướng chính tính toán nước đi thông minh nhất cho Bot
     * @returns {number} Trả về Index (vị trí) của lá bài tối ưu nhất trong mảng botHand
     */
    tinhToanNuocDi: function(botId, hands, roundCardsPlayed, currentRound, targetSuitOfRound, roundWinners, deadTungPlayers) {
        const botHand = hands[botId];
        
        // Các trường hợp phòng vệ biên cơ bản
        if (!botHand || botHand.length === 0) return 0;
        if (botHand.length === 1) return 0;

        let bestScore = -Infinity;
        let bestIndex = 0;

        // Quét toàn bộ các quân bài hiện có trên tay để chạy mô phỏng ma trận Minimax Heuristic
        for (let i = 0; i < botHand.length; i++) {
            const card = botHand[i];
            const score = this.chayMaTranDinhGia(card, botId, botHand, roundCardsPlayed, currentRound, targetSuitOfRound, roundWinners, deadTungPlayers);
            
            if (score > bestScore) {
                bestScore = score;
                bestIndex = i;
            }
        }
        return bestIndex;
    },

    /**
     * Hàm chấm điểm giả lập hành vi cây quyết định (Minimax Concept Scoring)
     */
    chayMaTranDinhGia: function(card, botId, botHand, roundCardsPlayed, currentRound, targetSuitOfRound, roundWinners, deadTungPlayers) {
        const hasTon = roundWinners.includes(botId);
        const isFirstPlay = (roundCardsPlayed.length === 0);
        const activeSuit = isFirstPlay ? card.suit : targetSuitOfRound;
        const isValidFollow = isFirstPlay || (card.suit === targetSuitOfRound);

        // Lấy thông tin quân bài đang tạm dẫn đầu vòng đấu hiện tại
        let currentWinPlay = null;
        if (roundCardsPlayed.length > 0) {
            currentWinPlay = this.timQuanBaiVoDichTamThoi(roundCardsPlayed, targetSuitOfRound);
        }

        let heuristicScore = 0;

        // Phân tích nội lực tay bài hiện tại của Bot để đưa ra sách lược tổng quát
        // Các quân từ J, Q, K, A (Độ lớn từ 11 đến 14) được coi là vũ khí hạng nặng
        const countQuanBaiChienLuoc = botHand.filter(c => c.weight >= 11).length;
        const totalCardsLeft = botHand.length;

        // =========================================================================
        // PHÂN KHÚC CHIẾN THUẬT A: TỪ VÒNG 1 ĐẾN VÒNG 4 (GIAI ĐOẠN ĐẤU SINH TỒN TIỀN ĐỀ)
        // =========================================================================
        if (currentRound <= 4) {
            if (!hasTon) {
                // CHẾ ĐỘ 1: KIẾM TỒN KHẨN CẤP (Chưa thắng vòng nào, đang đứng trước nguy cơ Chết Tùng)
                if (isFirstPlay) {
                    // Nếu Bot có quyền đi đầu vòng:
                    if (currentRound === 4) {
                        // Vòng 4 tử thần: Bung toàn bộ lực lượng, lấy lá lớn nhất để giật Tồn sống sót
                        heuristicScore = card.weight * 6;
                    } else {
                        // Vòng 1-3: Đánh lá trung bình lớn (10, J, Q) để dò đường kiếm Tồn sớm, giấu Át (14) lại tránh bị đè uổng phí
                        if (card.weight >= 10 && card.weight <= 13) {
                            heuristicScore = card.weight * 4;
                        } else if (card.weight === 14) {
                            heuristicScore = card.weight * 1.5; // Kìm hãm xuất quân Át quá bừa bãi ở đầu game
                        } else {
                            heuristicScore = card.weight;
                        }
                    }
                } else {
                    // Nếu Bot đi sau và phải theo nước bài:
                    if (isValidFollow) {
                        if (card.weight > currentWinPlay.card.weight) {
                            // Quân bài đủ sức đè bẹp đối thủ hiện tại
                            if (currentRound === 4) {
                                // Trận chiến cuối cùng: Đè bằng quân to nhất có thể để đảm bảo an toàn tuyệt đối
                                heuristicScore = card.weight * 10;
                            } else {
                                // Vòng 1-3 (Tối ưu hóa Alpha-Beta): Đè bằng lá bài NHỎ NHẤT có thể thắng nhằm tiết kiệm tài nguyên
                                const chenhLech = card.weight - currentWinPlay.card.weight;
                                heuristicScore = 300 - chenhLech + card.weight;
                            }
                        } else {
                            // Trùng nước nhưng nhỏ hơn quân vô địch -> Đánh ra sẽ bị úp vô ích, ưu tiên hủy lá nhỏ nhất
                            heuristicScore = -card.weight * 2;
                        }
                    } else {
                        // Lạc nước bài (Không có nước bài chuẩn) -> Buộc phải úp bài giấu mặt. Chọn hi sinh quân nhỏ nhất
                        heuristicScore = -card.weight * 3;
                    }
                }
            } else {
                // CHẾ ĐỘ 2: ĐÃ AN TOÀN CÓ TỒN -> ĐIỀU CHỈNH LUỒNG CHIẾN THUẬT CON
                // Kiểm tra xem tay bài có đạt trạng thái "HỦY DIỆT" (Tùng Sạch - Ghiền nát đối phương) hay không
                const isTungSachMode = (countQuanBaiChienLuoc >= 3 && totalCardsLeft >= 4);

                if (isTungSachMode) {
                    // PHƯƠNG ÁN TÙNG SẠCH: Bài quá mạnh, ép sân liên tục triệt hạ không cho các nhà khác vào vòng 5 6
                    if (isFirstPlay) {
                        heuristicScore = card.weight * 5; // Đánh phủ đầu quân lớn liên tục
                    } else {
                        if (isValidFollow && card.weight > currentWinPlay.card.weight) {
                            heuristicScore = card.weight * 5;
                        } else {
                            heuristicScore = -card.weight;
                        }
                    }
                } else {
                    // PHƯƠNG ÁN DƯỠNG BÀI: Giấu toàn bộ quân bài then chốt, xả rác nhỏ vô hại để chuẩn bị cho trận chung kết vòng 5 6
                    if (isFirstPlay) {
                        // Ưu tiên đánh các quân bài cực nhỏ để nhường cái cho người khác tiêu hao bài lớn
                        heuristicScore = (15 - card.weight) * 4;
                    } else {
                        if (isValidFollow && card.weight > currentWinPlay.card.weight) {
                            // Đã có tồn rồi thì hạn chế đè bài lớn, trừ phi quân bài dùng để đè là quân siêu rẻ (nhỏ hơn hoặc bằng 9)
                            if (card.weight <= 9) {
                                heuristicScore = 40; 
                            } else {
                                heuristicScore = -card.weight * 3; // Phạt nặng nếu phung phí Át/Già/Đầm khi đã có tồn bảo hiểm
                            }
                        } else {
                            // Chấp nhận úp bài nhường nhịn: Chọn lá rác nhỏ nhất để hi sinh dọn sạch tay bài
                            heuristicScore = -card.weight * 2;
                        }
                    }
                }
            }
        } 
        // =========================================================================
        // PHÂN KHÚC CHIẾN THUẬT B: VÒNG 5 (CHƯNG BÀI) VÀ VÒNG 6 (XỔ BÀI TRẬN CHUNG KẾT)
        // =========================================================================
        else {
            // Giai đoạn quyết định ngôi vương chung cuộc, dốc toàn bộ sức mạnh không khoan nhượng
            if (isFirstPlay) {
                // Đi đầu vòng 5 (Chưng bài): Đánh ra quân bài mạnh nhất, bá đạo nhất để làm thế độc tôn ép chết đối phương ở vòng 6
                heuristicScore = card.weight * 12;
            } else {
                if (isValidFollow) {
                    if (card.weight > currentWinPlay.card.weight) {
                        // Cơ hội ngàn vàng để cướp cái giành chiến thắng tối hậu
                        heuristicScore = card.weight * 15;
                    } else {
                        // 有水 nhưng nhỏ hơn quân bài chưng -> Thất bại, đẩy quân lớn đi trong vô vọng
                        heuristicScore = -card.weight;
                    }
                } else {
                    // Đi sai nước bài ở vòng 5, 6 là tự sát (bị đánh dấu dấu gạch chéo đỏ loại ngay lập tức)
                    heuristicScore = -card.weight * 6;
                }
            }
        }

        return heuristicScore;
    },

    /**
     * Hàm tiện ích mô phỏng xét duyệt quân bài lớn nhất giữ nước bài chuẩn trong vòng đấu
     */
    timQuanBaiVoDichTamThoi: function(roundCardsPlayed, targetSuit) {
        let winPlay = null;
        roundCardsPlayed.forEach(play => {
            if (play.card.suit === targetSuit) {
                if (!winPlay || play.card.weight > winPlay.card.weight) {
                    winPlay = play;
                }
            }
        });
        return winPlay;
    }
};