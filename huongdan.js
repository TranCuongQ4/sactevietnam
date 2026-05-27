// Quản lý và cung cấp nội dung bản hướng dẫn chơi Sắc Tê
const HuongDanModule = {
    tieuDe: "Hướng Dẫn Sắc Tê",
    tacGia: "Thiết Kế Trần Cường . Zalo: 0907860662",
    
    taiNoiDung: function() {
        return `
            <h2 style="color: #ffd700; text-align: center; margin-bottom: 10px;">${this.tieuDe}</h2>
            <p style="color: #fff; font-weight: bold; text-align: center; margin-bottom: 15px; font-size: 13px;">${this.tacGia}</p>
            <div style="font-size: 13px; line-height: 1.5; text-align: justify; border-top: 1px solid #fff; padding-top: 10px; margin-bottom: 15px;">
			    <p><b>*. Lưu Ý:</b>Nhấn Chia Bài Để Chơi Sau Đó Nhấn Quay Lượt Đi Để Xem Ai Đi Trước.Vòng Sáng Báo Tới Mình Thì Mới Được Thao Tác.</p><br>
                <p><b>1. Quy tắc cơ bản:</b> Mỗi người chơi nhận được 6 lá bài lúc khởi đầu trận đấu.</p><br>
                <p><b>2. Trật tự độ lớn lá bài:</b> Xếp theo thứ tự từ bé đến lớn: 2 &lt; 3 &lt; 4 &lt; 5 &lt; 6 &lt; 7 &lt; 8 &lt; 9 &lt; 10 &lt; J &lt; Q &lt; K &lt; A. Bài chỉ so sánh độ lớn khi <b>cùng nước bài</b> (Cơ, Rô, Chuồn, Bích). Không so sánh khác nước.</p><br>
                <p><b>3. Tiến trình chơi (Vòng 1 - 4):</b> Người đi đầu đánh ra 1 lá bài. Những người kế tiếp theo chiều kim đồng hồ phải đánh ra 1 lá bài cùng nước nhưng có giá trị cao hơn để giành quyền kiểm soát. Nếu không có hoặc đánh sai nước/nhỏ hơn, bài đánh ra lập tức úp xuống tính là mất lượt vòng đó.</p><br>
                <p><b>4. Quy tắc Chết Tùng:</b> Sau khi kết thúc vòng 4, bất kỳ người chơi nào có toàn bộ 4 lá bài đã đánh đều bị úp (không thắng nổi vòng nào từ 1 đến 4) sẽ bị xử thua cuộc lập tức (Chết Tùng) và hiện bảng STOP, không được dự phần vào vòng 5.</p><br>
                <p><b>5. Vòng 5 & Vòng 6 (Trưng bài & Sổ bài):</b> Những người còn sống sót sẽ tiến hành trưng 1 lá bài ở vòng 5. Ai có bài lớn nhất giữ nước sẽ được quyền quyết định vòng 6. Người thắng vòng cuối cùng là người thắng chung cuộc ăn trọn tiền cược.</p>
            </div>
            
            <div style="text-align: center; margin-top: 10px;">
                <button id="btn-dahieu" class="btn" onclick="document.getElementById('modal-huongdan').style.display = 'none';" style="background: linear-gradient(to bottom, #ffeb3b, #fbc02d); color: #333; width: 60%; box-shadow: 0 4px 0 #f57f17, 0 5px 8px rgba(0,0,0,0.4);">
                    Đã Hiểu Rồi
                </button>
            </div>
        `;
    }
};