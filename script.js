// Bộ điều khiển luồng tương tác logic chính điều hành toàn trận đấu (Vòng 1 -> Vòng 5)
document.addEventListener("DOMContentLoaded", function() {
    
    // --- KHAI BÁO BIẾN TRẠNG THÁI TOÀN CỤC VÁN ĐẤU ---
    let viTien = GiamSatModule.docViTien();
    let boBaiGoc = [];
    let hands = { south: [], east: [], north: [], west: [] };
    let playedHistory = { south: [], east: [], north: [], west: [] };
    
    let isGameRunning = false;
    let isWaitingRoundTransition = false; // Biến cờ bảo vệ luồng bất đồng bộ chặn double-click hoặc đè lượt
    let currentRound = 1; // Từ vòng 1 tới vòng 6
    let turnOrder = ['south', 'west', 'north', 'east']; // Vòng tròn kim đồng hồ định sẵn
    let currentTurnIndex = 0;
    let starterOfRound = 'south';
    
    let roundCardsPlayed = []; // Lưu các lá đánh ra trong vòng hiện tại: {playerId, card}
    let targetSuitOfRound = ""; // Nước bài chuẩn của vòng hiện tại
    let roundWinners = []; // Lưu ID thắng vòng 1->4
    let deadTungPlayers = { south: false, east: false, north: false, west: false };
    let selectedCardId = null;

    // --- KHAI BÁO AUDIO NHẠC NỀN (ĐÃ CẬP NHẬT MẶC ĐỊNH BẬT) ---
    const bgm = new Audio('sacte.mp3');
    bgm.loop = true; // Thiết lập phát nhạc lặp lại mãi mãi
    let isBgmPlaying = true; // Mặc định mở nhạc ngay khi vào game

    // --- DOM ELEMENTS CẦN THIẾT ---
    const btnChia = document.getElementById("btn-chia");
    const btnQuay = document.getElementById("btn-quay");
    const btnHuongDan = document.getElementById("btn-huongdan");
    const btnDanh = document.getElementById("btn-danh");
    const btnNewGame = document.getElementById("btn-newgame");
    const btnBgm = document.getElementById("btn-bgm"); // Nút Nhạc Nền
    const toastOverlay = document.getElementById("status-announcement");
    const modalHuongDan = document.getElementById("modal-huongdan");
    const modalVictory = document.getElementById("modal-victory");

    // Chặn chuột phải và hành vi kéo khối văn bản bảo mật cấu trúc
    document.addEventListener("contextmenu", e => e.preventDefault());
    document.body.addEventListener("dragstart", e => e.preventDefault());

    // Cập nhật hiển thị ví tiền khởi điểm lên UI
    function hienThiTien() {
        document.getElementById("money-south").innerText = `${viTien.south} $`;
        document.getElementById("money-east").innerText = `${viTien.east} $`;
        document.getElementById("money-north").innerText = `${viTien.north} $`;
        document.getElementById("money-west").innerText = `${viTien.west} $`;
    }

    // --- BỘ KIỂM SOÁT QUY ĐỊNH TÀI CHÍNH TỰ ĐỘNG ---
    function kiemTraVaXuLyQuyDinhTien() {
        let coThayDoi = false;
        
        // 1. Quy định Reset: Nếu có bất kỳ ai đạt mốc từ 200,000 $ trở lên thì đặt lại ví mỗi người về 2,000 $
        let coAiDatMocGiau = ['south', 'east', 'north', 'west'].some(p => viTien[p] >= 200000);
        if (coAiDatMocGiau) {
            ['south', 'east', 'north', 'west'].forEach(p => {
                viTien[p] = 2000;
            });
            coThayDoi = true;
            setTimeout(() => {
                showToast("Đại Gia Có 200,000$ Nè ! Hệ Thống Mời Bạn Sang Khu VIP Nhé!...", 10000);
            }, 600);
        } else {
            // 2. Quy định Hoàn tiền: Trợ cấp ngay 2,000 $ cho bất kỳ người chơi nào hết tiền (ví về <= 0 $)
            ['south', 'east', 'north', 'west'].forEach(p => {
                if (viTien[p] <= 0) {
                    viTien[p] = 2000;
                    coThayDoi = true;
                    setTimeout(() => {
                        showToast(`${dichTen(p)} Đã Chơi Cố Gắng Rồi ! Hệ Thống Tặng 2,000$ Nha ! Ha Ha Ha.`, 4000);
                    }, 500);
                }
            });
        }

        if (coThayDoi) {
            GiamSatModule.capNhatViTien(viTien);
        }
    }

    // Thực thi quét kiểm tra ví tiền ngay khi khởi tạo trang web
    kiemTraVaXuLyQuyDinhTien();
    hienThiTien();

    // --- KÍCH HOẠT NHẠC NỀN TỰ ĐỘNG THÔNG MINH ---
    if (btnBgm) btnBgm.innerHTML = "🔊 Nhạc Nền";

    function coGangPhatNhacNgay() {
        if (isBgmPlaying) {
            bgm.play().catch(err => {
                console.log("Chào Mừng Đến Với Sắc Tê Việt Nam");
            });
        }
    }
    coGangPhatNhacNgay();

    document.addEventListener("click", function kichHoatNhacNenTuDong() {
        if (isBgmPlaying && bgm.paused) {
            bgm.play().catch(err => console.log("Lỗi âm thanh:", err));
        }
        document.removeEventListener("click", kichHoatNhacNenTuDong);
    });

    // --- XỬ LÝ SỰ KIỆN NÚT BẤM CƠ BẢN ---
    btnHuongDan.addEventListener("click", () => {
        document.getElementById("huongdan-content").innerHTML = HuongDanModule.taiNoiDung();
        modalHuongDan.style.display = "flex";
    });

    document.querySelector(".close-modal").addEventListener("click", () => {
        modalHuongDan.style.display = "none";
    });

    btnBgm.addEventListener("click", function(e) {
        e.stopPropagation();
        if (isBgmPlaying) {
            bgm.pause();
            btnBgm.innerHTML = "🔇 Nhạc Nền";
            isBgmPlaying = false;
        } else {
            bgm.play().catch(err => {
                console.log("Không thể phát audio:", err);
            });
            btnBgm.innerHTML = "🔊 Nhạc Nền";
            isBgmPlaying = true;
        }
    });

    // --- TIẾN TRÌNH 1: CHIA BÀI HIỆU ỨNG XOAY VÒNG KIM ĐỒNG HỒ ---
    btnChia.addEventListener("click", function() {
        btnChia.disabled = true;
        isGameRunning = true;
        isWaitingRoundTransition = false;
        
        ['south', 'east', 'north', 'west'].forEach(p => viTien[p] -= 50);
        kiemTraVaXuLyQuyDinhTien();
        
        GiamSatModule.capNhatViTien(viTien);
        hienThiTien();

        boBaiGoc = BoBaiModule.taoBoBaiMoi();
        BoBaiModule.xaoBai(boBaiGoc);

        hands = { south: [], east: [], north: [], west: [] };
        playedHistory = { south: [], east: [], north: [], west: [] };
        roundWinners = [];
        deadTungPlayers = { south: false, east: false, north: false, west: false };
        currentRound = 1;
        selectedCardId = null;

        clearBoardUI();

        chiaBaiTheoVong(
    boBaiGoc,
    hands,
    renderAllHands,
    function() {

        btnQuay.disabled = false;

    }
);
    });

    function clearBoardUI() {
        ['south', 'east', 'north', 'west'].forEach(p => {
            document.getElementById(`hand-${p}`).innerHTML = "";
            document.getElementById(`played-${p}`).innerHTML = "";
            document.getElementById(`player-${p}`).classList.remove("dead-tung", "active-turn");
        });
    }

        function renderAllHands() {
        ['south', 'east', 'north', 'west'].forEach(p => {
            let container = document.getElementById(`hand-${p}`);
            container.innerHTML = "";
            
            if (deadTungPlayers[p]) return;

            hands[p].forEach(card => {
                let isOpen = (p === 'south');
                let cardHTML = BoBaiModule.renderCardHTML(card, isOpen);
                
                let wrapper = document.createElement("div");
                wrapper.innerHTML = cardHTML.trim();
                let cardElem = wrapper.firstChild;

                if (p === 'south') {
                    // Kiểm tra xem quân bài này có đang được chọn hay không (áp dụng cho cả ván cũ lẫn ván mới)
                    if (currentRound <= 5 && selectedCardId === card.id) {
                        cardElem.classList.add("selected-card");
                    } else if (currentRound === 6 && TuanHoanVongSauModule.laySelectedCardIdVong6() === card.id) {
                        cardElem.classList.add("selected-card");
                    }

                    cardElem.addEventListener("click", function() {
                        if (currentRound <= 5) {
                            if (currentTurnIndex !== 0 || isWaitingRoundTransition) return; 
                            
                            if (selectedCardId === card.id) {
                                cardElem.classList.remove("selected-card");
                                selectedCardId = null;
                                btnDanh.disabled = true;
                            } else {
                                document.querySelectorAll("#hand-south .card-base").forEach(c => c.classList.remove("selected-card"));
                                cardElem.classList.add("selected-card");
                                selectedCardId = card.id;
                                btnDanh.disabled = false;
                            }
                        } else {
                            // Nếu ở vòng 6, ủy quyền xử lý click cho module tuần hoàn quản lý độc lập
                            TuanHoanVongSauModule.xuLyClickChonBaiUser(card.id, cardElem);
                        }
                    });
                }
                container.appendChild(cardElem);
            });
        });
    }

    // --- TIẾN TRÌNH 2: QUAY LƯỢT ĐI ĐẦU TRẬN ---
    btnQuay.addEventListener("click", function() {
        btnQuay.disabled = true;
        let pool = ['south', 'west', 'north', 'east'];
        let cycleCount = 0;
        let maxCycles = 12; 
        let currentIndex = 0;

        let interval = setInterval(() => {
            pool.forEach(p => document.getElementById(`player-${p}`).classList.remove("active-turn"));
            let currentPick = pool[currentIndex % 4];
            document.getElementById(`player-${currentPick}`).classList.add("active-turn");
            
            currentIndex++;
            cycleCount++;

            if (cycleCount >= maxCycles) {
                clearInterval(interval);
                
                let luckyIndex = Math.floor(Math.random() * 4);
                starterOfRound = pool[luckyIndex];
                
                pool.forEach(p => document.getElementById(`player-${p}`).classList.remove("active-turn"));
                document.getElementById(`player-${starterOfRound}`).classList.add("active-turn");
                currentTurnIndex = turnOrder.indexOf(starterOfRound);

                let tenNguoiChoi = dichTen(starterOfRound);
                showToast(`${tenNguoiChoi} Là Người Đánh Bài Trước`, 2000);

                setTimeout(() => {
                    batDauVongChoiMoi();
                }, 2000);
            }
        }, 150);
    });

    function dichTen(id) {
        if (id === 'south') return "Tôi";
        if (id === 'west') return "Bot Tây";
        if (id === 'north') return "Bot Bắc";
        return "Bot Đông";
    }

    function showToast(text, duration) {
        toastOverlay.innerText = text;
        toastOverlay.style.display = "block";
        setTimeout(() => {
            toastOverlay.style.display = "none";
        }, duration);
    }

    // --- TIẾN TRÌNH 3: ĐIỀU HÀNH VÒNG CHƠI CHÍNH ---
    function batDauVongChoiMoi() {
        roundCardsPlayed = [];
        targetSuitOfRound = "";
        isWaitingRoundTransition = false; 
        
        if (currentRound === 5) {
            let gucTungReport = GiamSatModule.kiemTraGucTung(roundWinners);
            let activeCount = 0;
            
            ['south', 'west', 'north', 'east'].forEach(p => {
                if (gucTungReport[p]) {
                    deadTungPlayers[p] = true;
                    document.getElementById(`player-${p}`).classList.add("dead-tung");
                } else {
                    activeCount++;
                }
            });

            renderAllHands();

            if (activeCount <= 1) {
                let winner = ['south', 'west', 'north', 'east'].find(p => !deadTungPlayers[p]) || starterOfRound;
                xuLyChungCuocTran(winner);
                return;
            }
        }

        while (deadTungPlayers[starterOfRound]) {
            let nextIdx = (turnOrder.indexOf(starterOfRound) + 1) % 4;
            starterOfRound = turnOrder[nextIdx];
        }

        currentTurnIndex = turnOrder.indexOf(starterOfRound);
        updateTurnVisualGlow();
        
        if (currentTurnIndex !== 0) {
            setTimeout(xuLyLuotDiCuaBot, 1500);
        } else {
            btnDanh.disabled = (selectedCardId === null);
        }
    }

    function updateTurnVisualGlow() {
        ['south', 'east', 'north', 'west'].forEach(p => {
            document.getElementById(`player-${p}`).classList.remove("active-turn");
        });
        let activePlayerId = turnOrder[currentTurnIndex];
        if (!deadTungPlayers[activePlayerId]) {
            document.getElementById(`player-${activePlayerId}`).classList.add("active-turn");
        }
    }

    // Gắn sự kiện click chung duy nhất cho nút đánh bài, phân nhánh xử lý theo vòng đấu
    btnDanh.addEventListener("click", function() {
        if (currentRound === 6) {
            // Chuyển tiếp luồng xử lý đánh bài vòng 6 sang module tuần hoàn quản lý
            TuanHoanVongSauModule.thucHienHaBaiUserVong6();
            return;
        }

        if (currentTurnIndex !== 0 || !selectedCardId || isWaitingRoundTransition) return;

        let myHand = hands['south'];
        let cardIdx = myHand.findIndex(c => c.id === selectedCardId);
        if (cardIdx === -1) return;

        let cardPlayed = myHand.splice(cardIdx, 1)[0];
        selectedCardId = null;
        btnDanh.disabled = true;

        renderAllHands();
        ghiNhanDanhBai('south', cardPlayed);
    });

    function xuLyLuotDiCuaBot() {
        if (isWaitingRoundTransition) return;

        let botId = turnOrder[currentTurnIndex];
        
        if (deadTungPlayers[botId]) {
            chuyenLuotTiepTheo();
            return;
        }

        let botHand = hands[botId];
        if (!botHand || botHand.length === 0) {
            chuyenLuotTiepTheo();
            return;
        }

        let chosenIdx = BotSacteAI.tinhToanNuocDi(
            botId, 
            hands, 
            roundCardsPlayed, 
            currentRound, 
            targetSuitOfRound, 
            roundWinners, 
            deadTungPlayers
        );

        let cardPlayed = botHand.splice(chosenIdx, 1)[0];
        renderAllHands();
        ghiNhanDanhBai(botId, cardPlayed);
    }

    function ghiNhanDanhBai(playerId, card) {
        let isFirstOfRound = (roundCardsPlayed.length === 0);
        if (isFirstOfRound) {
            targetSuitOfRound = card.suit;
        }

        roundCardsPlayed.push({ playerId: playerId, card: card });

        if (currentRound <= 4) {
            let playedContainer = document.getElementById(`played-${playerId}`);
            let openHTML = BoBaiModule.renderCardHTML(card, true); 
            let wrapper = document.createElement("div");
            wrapper.innerHTML = openHTML.trim();
            playedContainer.appendChild(wrapper.firstChild);

            let winPlay = GiamSatModule.xetThangVong(roundCardsPlayed, targetSuitOfRound);
            
            roundCardsPlayed.forEach(play => {
                let cardDOM = document.querySelector(`#played-${play.playerId} [data-card-id="${play.card.id}"]`);
                if (cardDOM) {
                    if (play.playerId === winPlay.playerId && play.card.id === winPlay.card.id) {
                        // Giữ nguyên quân lớn dẫn đầu
                    } else {
                        cardDOM.className = "card-base card-back";
                        cardDOM.innerHTML = "";
                    }
                }
            });
            
            chuyenLuotTiepTheo();
        } else {
            let playedContainer = document.getElementById(`played-${playerId}`);
            let openHTML = BoBaiModule.renderCardHTML(card, true);
            let wrapper = document.createElement("div");
            wrapper.innerHTML = openHTML.trim();
            let addedCardDOM = wrapper.firstChild;
            playedContainer.appendChild(addedCardDOM);

            if (card.suit !== targetSuitOfRound) {
                addedCardDOM.classList.add("eliminated-cross");
            } else {
                let winPlay = GiamSatModule.xetThangVong(roundCardsPlayed, targetSuitOfRound);
                roundCardsPlayed.forEach(play => {
                    let cDOM = document.querySelector(`#played-${play.playerId} [data-card-id="${play.card.id}"]`);
                    if (cDOM) {
                        if (play.playerId === winPlay.playerId && play.card.id === winPlay.card.id && play.card.suit === targetSuitOfRound) {
                            cDOM.classList.remove("eliminated-cross");
                        } else {
                            cDOM.classList.add("eliminated-cross");
                        }
                    }
                });
            }

            chuyenLuotTiepTheo();
        }
    }

    // --- TIẾN TRÌNH DI CHUYỂN LƯỢT ĐÁNH ---
    function chuyenLuotTiepTheo() {
        if (isWaitingRoundTransition) return;

        let activeCount = ['south', 'west', 'north', 'east'].filter(p => !deadTungPlayers[p]).length;
        let currentRoundPlaysCount = roundCardsPlayed.length;
        
        if (currentRoundPlaysCount >= activeCount) {
            isWaitingRoundTransition = true; 
            btnDanh.disabled = true;
            
            ['south', 'east', 'north', 'west'].forEach(p => {
                document.getElementById(`player-${p}`).classList.remove("active-turn");
            });

            setTimeout(ketThucVongHienTai, 1500);
            return;
        }

        do {
            currentTurnIndex = (currentTurnIndex + 1) % 4;
        } while (deadTungPlayers[turnOrder[currentTurnIndex]]);
        
        setTimeout(() => {
            if (isWaitingRoundTransition) return;

            updateTurnVisualGlow();

            if (currentTurnIndex !== 0) {
                xuLyLuotDiCuaBot(); 
            } else {
                btnDanh.disabled = (selectedCardId === null);
            }
        }, 1500);
    }

    // --- TIẾN TRÌNH KẾT THÚC VÒNG CHƠI ĐƠN LẺ ---
    function ketThucVongHienTai() {
        let tieuChuanSuit = targetSuitOfRound;
        let winPlay = GiamSatModule.xetThangVong(roundCardsPlayed, tieuChuanSuit);
        let nguoiThangVongId = winPlay ? winPlay.playerId : starterOfRound;
        
        if (currentRound <= 4) {

    roundWinners.push(nguoiThangVongId);

    starterOfRound = nguoiThangVongId;

    currentRound++;

    let thongBaoText = "";

    // Chỉ riêng từ vòng 4 sang vòng 5
    if (currentRound === 5) {

        thongBaoText =
        `${dichTen(nguoiThangVongId)} Hãy Trưng Bài Lên Để Giành Phần Thắng Nhé`;

    } else {

        thongBaoText =
        `${dichTen(nguoiThangVongId)} Được Quyền Đánh Trước Bài Nhé`;

    }

    showToast(thongBaoText, 2000);

    setTimeout(batDauVongChoiMoi, 2000);

}
else if (currentRound === 5) {
            starterOfRound = nguoiThangVongId;
            let thongBaoText = `Vòng Cuối ${dichTen(nguoiThangVongId)} Mở Lá Bài Để Kết Thúc Nha`;
            showToast(thongBaoText, 2000);
            
            currentRound = 6; 
            
            setTimeout(() => {
                TuanHoanVongSauModule.khoiDongGiamSatVong6(
                    turnOrder, 
                    deadTungPlayers, 
                    starterOfRound,
                    hands,             
                    renderAllHands,    
                    xuLyChungCuocTran, 
                    dichTen,
                    showToast
                );
            }, 4000);
        }
    }

    // --- TIẾN TRÌNH KẾT THÚC VÁN ĐẤU & KẾ TOÁN SỐ DƯ ---
    function xuLyChungCuocTran(winnerId) {
        isGameRunning = false;
        isWaitingRoundTransition = false;
        currentRound = 1; 
        selectedCardId = null;
        
        viTien[winnerId] += 250; 
        kiemTraVaXuLyQuyDinhTien();
        
        GiamSatModule.capNhatViTien(viTien);
        hienThiTien();

        document.getElementById("victory-text").innerHTML = `
            Chúc Mừng ${dichTen(winnerId)} Là Người Thắng Chung Cuộc<br>Với Số Tiền 200 $
        `;
        modalVictory.style.display = "flex";
    }

    btnNewGame.addEventListener("click", function() {
        modalVictory.style.display = "none";
        clearBoardUI();
        btnChia.disabled = false;
        btnQuay.disabled = true;
        btnDanh.disabled = true;
        isWaitingRoundTransition = false;
    });
});