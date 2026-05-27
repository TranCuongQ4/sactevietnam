/**
 * TUANHOAN.JS - TRỌNG TÀI TỐI CAO ĐIỀU HÀNH ĐỘC LẬP VÀ QUYẾT ĐỊNH CHIẾN THẮNG VÒNG 6
 */
const TuanHoanVongSauModule = (function() {
    let danhSachSongSot = [];
    let indexNguoiHienTai = 0;
    let nguoiCuoiCungId = "";
    
    // Quản lý riêng trạng thái chọn bài của User ở vòng 6
    let vong6SelectedCardId = null;

    // Lưu các quân bài thực tế được đánh ra trong Vòng 6 tại Module Tuần Hoàn
    let round6CardsPlayed = []; 
    let targetSuitRound6 = ""; 

    // Các tham chiếu chức năng đồng bộ từ môi trường script.js
    let thamChieuHands = null;
    let thamChieuRender = null;
    let thamChieuXuLyChungCuoc = null;
    let thamChieuDichTen = null;
    let thamChieuShowToast = null;

    /**
     * Khởi động chế độ giám sát vòng 6 độc quyền và kiểm soát luồng chung cuộc bài Sắc Tê
     */
    function khoiDongGiamSatVong6(turnOrder, deadTungPlayers, starterId, handsObj, renderFn, xuLyChungCuocFn, dichTenFn, showToastFn) {
        console.log("=== BỘ GIÁM SÁT TUÂN HOÀN VÒNG 6: KÍCH HOẠT QUYỀN ĐIỀU HÀNH TỐI CAO ===");
        
        // Đồng bộ tài nguyên hệ thống
        thamChieuHands = handsObj;
        thamChieuRender = renderFn;
        thamChieuXuLyChungCuoc = xuLyChungCuocFn;
        thamChieuDichTen = dichTenFn;
        thamChieuShowToast = showToastFn;

        // Reset dữ liệu vòng 6 của module tuần hoàn
        round6CardsPlayed = [];
        targetSuitRound6 = "";
        vong6SelectedCardId = null;

        // 1. Lọc chính xác những nhà còn sống sót bước vào vòng 6 (không bị gục tùng)
        let danhSachGoc = ['south', 'west', 'north', 'east'];
        danhSachSongSot = danhSachGoc.filter(p => !deadTungPlayers[p]);

        // 2. Định tuyến danh sách đánh theo thứ tự vòng, bắt đầu từ người thắng vòng 5 (starterId)
        let startIdx = danhSachSongSot.indexOf(starterId);
        if (startIdx !== -1) {
            let tuStarter = danhSachSongSot.slice(startIdx);
            let truocStarter = danhSachSongSot.slice(0, startIdx);
            danhSachSongSot = tuStarter.concat(truocStarter);
        }

        // 3. Đánh dấu người chốt chặn cuối cùng hạ bài
        nguoiCuoiCungId = danhSachSongSot[danhSachSongSot.length - 1];
        indexNguoiHienTai = 0;

        console.log("-> Danh sách tuần hoàn vòng 6:", danhSachSongSot);
        console.log("-> Người đánh bài trước:", starterId);

        // Kích hoạt người chơi đầu tiên ra bài
        thucThiLuotDanhVong6();
    }

    /**
     * Xuất ID quân bài đang được chọn ở vòng 6 ra bên ngoài cho renderAllHands đồng bộ
     */
    function laySelectedCardIdVong6() {
        return vong6SelectedCardId;
    }

    /**
     * Hàm điều hướng click chọn quân bài dành riêng cho User tại Vòng 6
     */
    function xuLyClickChonBaiUser(cardId, cardElem) {
        let nguoiHienTaiId = danhSachSongSot[indexNguoiHienTai];
        if (nguoiHienTaiId !== 'south') return;

        const btnDanh = document.getElementById("btn-danh");

        if (vong6SelectedCardId === cardId) {
            cardElem.classList.remove("selected-card");
            vong6SelectedCardId = null;
            if (btnDanh) btnDanh.disabled = true;
        } else {
            document.querySelectorAll("#hand-south .card-base").forEach(c => c.classList.remove("selected-card"));
            cardElem.classList.add("selected-card");
            vong6SelectedCardId = cardId;
            if (btnDanh) btnDanh.disabled = false;
        }
    }

    /**
     * Hàm xử lý khi User nhấn nút "Đánh Bài" gốc từ file script.js truyền sang ở vòng 6
     */
    function thucHienHaBaiUserVong6() {
        if (vong6SelectedCardId === null) return;

        let userHand = thamChieuHands['south'];
        let cardIdx = userHand.findIndex(c => c.id === vong6SelectedCardId);
        
        if (cardIdx !== -1) {
            let cardPlayed = userHand.splice(cardIdx, 1)[0];
            vong6SelectedCardId = null;
            
            const btnDanh = document.getElementById("btn-danh");
            if (btnDanh) btnDanh.disabled = true;
            
            if (typeof thamChieuRender === "function") thamChieuRender();
            
            // Tiếp nhận xử lý lá bài
            tiepNhanLaBaiVong6('south', cardPlayed);
        }
    }

    /**
     * Điều phối lượt đánh nội bộ vòng 6 độc lập
     */
    function thucThiLuotDanhVong6() {
        if (indexNguoiHienTai >= danhSachSongSot.length) {
            xuLyKetThucVong6QuyetDinhThangThua();
            return;
        }

        let nguoiHienTaiId = danhSachSongSot[indexNguoiHienTai];

        // Highlight đèn sáng cho người tới lượt trên UI bàn đấu
        document.querySelectorAll(".player-card-block").forEach(b => b.classList.remove("active-turn"));
        const activeDOM = document.getElementById(`player-${nguoiHienTaiId}`);
        if (activeDOM) activeDOM.classList.add("active-turn");

        // NẾU TỚI LƯỢT TÔI (Người chơi phía Nam)
        if (nguoiHienTaiId === 'south') {
            console.log("[TuanHoan] Mời bạn bấm chọn bài và đánh quân bài cuối cùng.");
            if (typeof thamChieuShowToast === "function") {
                thamChieuShowToast("Đến Lượt Bạn Hạ Lá Bài Vòng 6 Quyết Định!", 3000);
            }

            const btnDanh = document.getElementById("btn-danh");
            if (btnDanh) btnDanh.disabled = (vong6SelectedCardId === null);
            return;
        }

        // NẾU TỚI LƯỢT CÁC BOT (Tây, Bắc, Đông)
        console.log(`[TuanHoan] Tự động vận hành Bot [${nguoiHienTaiId}] ra bài vòng 6...`);
        setTimeout(() => {
            let botHand = thamChieuHands[nguoiHienTaiId];
            if (!botHand || botHand.length === 0) {
                indexNguoiHienTai++;
                thucThiLuotDanhVong6();
                return;
            }

            // Gọi AI đưa ra quyết định tối ưu cho lá cuối cùng
            let chosenIdx = BotSacteAI.tinhToanNuocDi(
                nguoiHienTaiId,
                thamChieuHands,
                round6CardsPlayed, 
                6, 
                targetSuitRound6, 
                [], 
                { south: false, east: false, north: false, west: false }
            );

            let cardPlayed = botHand.splice(chosenIdx, 1)[0];
            if (typeof thamChieuRender === "function") thamChieuRender();

            tiepNhanLaBaiVong6(nguoiHienTaiId, cardPlayed);
        }, 1500);
    }

    /**
     * Tiếp nhận bài và hiển thị lên UI bàn đấu vòng 6 độc lập
     */
    function tiepNhanLaBaiVong6(playerId, card) {
        if (round6CardsPlayed.length === 0) {
            targetSuitRound6 = card.suit;
            console.log(`[TuanHoan] Nước bài chuẩn vòng 6 là: ${targetSuitRound6}`);
        }

        round6CardsPlayed.push({ playerId: playerId, card: card });

        let playedContainer = document.getElementById(`played-${playerId}`);
        if (playedContainer) {
            let openHTML = BoBaiModule.renderCardHTML(card, true);
            let wrapper = document.createElement("div");
            wrapper.innerHTML = openHTML.trim();
            let addedCardDOM = wrapper.firstChild;
            playedContainer.appendChild(addedCardDOM);

            if (card.suit !== targetSuitRound6) {
                addedCardDOM.classList.add("eliminated-cross");
            }
        }

        // Tịnh tiến sang người kế tiếp trong danh sách tuần hoàn
        indexNguoiHienTai++;
        thucThiLuotDanhVong6();
    }

    /**
     * Kết toán tìm người thắng cuộc hạ lá hợp lệ lớn nhất
     */
    function xuLyKetThucVong6QuyetDinhThangThua() {
        console.log("=== VÒNG 6 HOÀN THÀNH - BẮT ĐẦU SO BÀI CHUNG CUỘC ===");
        
        let winPlay = GiamSatModule.xetThangVong(round6CardsPlayed, targetSuitRound6);
        let nguoiThangCuocId = winPlay ? winPlay.playerId : danhSachSongSot[0];
        let tenNguoiThang = typeof thamChieuDichTen === "function" ? thamChieuDichTen(nguoiThangCuocId) : nguoiThangCuocId;

        // Cập nhật hiệu ứng gạch chéo đỏ các quân bài thua trên bàn đấu
        round6CardsPlayed.forEach(play => {
            let cDOM = document.querySelector(`#played-${play.playerId} [data-card-id="${play.card.id}"]`);
            if (cDOM) {
                if (winPlay && play.playerId === winPlay.playerId && play.card.id === winPlay.card.id && play.card.suit === targetSuitRound6) {
                    cDOM.classList.remove("eliminated-cross");
                } else {
                    cDOM.classList.add("eliminated-cross");
                }
            }
        });

        if (typeof thamChieuShowToast === "function") {
            thamChieuShowToast(`Ván Bài Kết Thúc! ${tenNguoiThang} Giành Chiến Thắng Chung Cuộc!`, 10000);
        }

        // Gọi hàm kết thúc bàn giao tài chính cộng tiền thưởng của script.js
        setTimeout(() => {
            if (typeof thamChieuXuLyChungCuoc === "function") {
                thamChieuXuLyChungCuoc(nguoiThangCuocId);
            }
        }, 2000);
    }

    return {
        khoiDongGiamSatVong6: khoiDongGiamSatVong6,
        xuLyClickChonBaiUser: xuLyClickChonBaiUser,
        thucHienHaBaiUserVong6: thucHienHaBaiUserVong6,
        laySelectedCardIdVong6: laySelectedCardIdVong6
    };
})();