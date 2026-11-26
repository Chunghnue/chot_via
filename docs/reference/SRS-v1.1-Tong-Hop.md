# XIN VÍA -- TỔNG HỢP SẢN PHẨM, SRS VÀ THIẾT KẾ GIAO DIỆN

**Phiên bản:** 1.1\
**Ngày tổng hợp:** 19/11/2026\
**Nền tảng:** Mobile Web / PWA / Tablet / Desktop\
**Định hướng:** Cộng đồng giải trí dành cho chủ kinh doanh, hộ kinh
doanh, doanh nghiệp và nhân viên sale.

------------------------------------------------------------------------

## 1. Tầm nhìn sản phẩm

Xin Vía là một cộng đồng trực tuyến mang tính giải trí, chia sẻ và động
viên tinh thần cho người đang kinh doanh hoặc làm công việc bán hàng.

Mục tiêu trải nghiệm:

-   Giúp người dùng giải tỏa tâm lý sau những ngày bán hàng khó khăn, áp
    lực doanh số hoặc KPI.
-   Tạo không gian để chủ cửa hàng chia sẻ câu chuyện, doanh thu, số đơn
    và thành tích.
-   Tạo không gian để nhân viên sale chia sẻ deal, KPI, hợp đồng và
    những tình huống nghề nghiệp.
-   Khuyến khích tương tác tích cực qua cơ chế **Ghé phố -- Gửi vía --
    Nhận vía**.
-   Tạo niềm tin cá nhân thông qua hồ sơ, cửa hàng hoặc văn phòng 3D do
    người dùng tự tạo.
-   Tạo sự tò mò và cảm giác vui vẻ bằng một khu phố kinh doanh 3D.

Xin Vía không phải phần mềm quản lý bán hàng và không nên biến thành
nơi cạnh tranh doanh thu căng thẳng. Yếu tố giải trí, đồng cảm và động
viên phải được ưu tiên.

## 2. Nguyên tắc trải nghiệm cốt lõi

### 2.1. Vào là xin vía được ngay

Không yêu cầu đăng nhập khi người dùng:

-   Mở trang chủ.
-   Xem bảng tin chung.
-   Xem hoặc khám phá phố 3D.
-   Ghé xem cửa hàng hoặc văn phòng sale công khai.
-   Xin vía Thần Tài.
-   Gửi vía tới cửa hàng hoặc sale.
-   Nhận lời chúc tự động từ cửa hàng/sale đã bật tính năng.

Chỉ yêu cầu đăng nhập khi người dùng chủ động thực hiện hành động cần
lưu danh tính hoặc quyền sở hữu:

-   Đăng bài Kể khổ.
-   Đăng bài Khoe doanh thu hoặc Khoe deal.
-   Lưu thành tích vào hồ sơ.
-   Tạo hoặc chỉnh sửa cửa hàng 3D.
-   Tạo hoặc chỉnh sửa văn phòng sale 3D.
-   Theo dõi, bình luận hoặc các thao tác khác cần gắn với tài khoản.

Không hiển thị màn hình đăng nhập ngay khi truy cập và không tự bật
popup đăng nhập khi chưa có hành động cần xác thực.

### 2.2. Ba hành động chính

Ba hành động chính trên trang chủ:

1.  **Kể khổ** -- chia sẻ khó khăn, tình huống dở khóc dở cười trong
    kinh doanh hoặc công việc sale.
2.  **Xin vía** -- hành động trung tâm, nổi bật nhất.
3.  **Khoe doanh thu / Khoe deal** -- chia sẻ thành tích kinh doanh hoặc
    thành tích sale.

Ba hành động này không phải ba bảng tin riêng biệt. Kể khổ và Khoe được
hiển thị xen kẽ trong **một bảng tin cộng đồng duy nhất**.

### 2.3. Một bảng tin chung

Bảng tin chung gồm nhiều loại nội dung:

-   Kể khổ.
-   Khoe doanh thu của chủ cửa hàng/chủ kinh doanh.
-   Khoe deal, KPI hoặc hợp đồng của nhân viên sale.
-   Bài chia sẻ xin vía nếu người đăng chủ động chọn công khai.

Có thể cung cấp bộ lọc:

-   Tất cả.
-   Kể khổ.
-   Khoe thành tích.
-   Xin vía (nếu có bài chia sẻ công khai).

Các bộ lọc chỉ thay đổi nội dung trong cùng một feed, không điều hướng
sang các khu vực có bảng tin tách biệt.

### 2.4. Tinh thần thiết kế

-   Đơn giản, hiện đại, thoáng và dễ hiểu.
-   Mang tính giải trí cộng đồng cao, gần gũi với chủ quán và nhân viên
    sale.
-   Không quá nghiêm túc như phần mềm quản trị doanh nghiệp.
-   Phố/cửa hàng 3D tạo tò mò nhưng không làm giảm độ nổi bật của nút
    Xin vía.
-   Không để quá nhiều hiệu ứng, vật thể hoặc bảng thông tin cạnh tranh
    với hành động chính.
-   Giao diện cần responsive cho điện thoại, iPad, máy tính và màn hình
    lớn.

------------------------------------------------------------------------

## 3. Cơ chế Xin vía

### 3.1. Xin vía mặc định từ Thần Tài

Khi người dùng mở trang chủ và bấm Xin vía:

1.  Mở popup Xin vía Thần Tài.
2.  Hiển thị hình tượng Thần Tài vui vẻ, thân thiện.
3.  Hiển thị lời chúc tích cực để người xin vía cảm thấy được động viên
    và tự tin hơn.
4.  Người dùng bấm Nhận vía hoặc CTA tương ứng.
5.  Hiển thị hiệu ứng nhận vía ngắn gọn, vui vẻ.
6.  Không yêu cầu đăng nhập, tên, số điện thoại hoặc email.

Thông điệp cần tạo cảm giác Thần Tài đã trao vía, tiếp thêm tinh thần
cho người dùng. Nội dung là trải nghiệm giải trí/động viên, không hứa
hẹn chắc chắn mang lại doanh thu, tiền bạc hoặc may mắn ngoài đời thực.

### 3.2. Tiêu đề Xin vía theo lần và thời điểm

Yêu cầu nội dung đã thống nhất:

-   Lần đầu: **Xin vía hôm nay**.
-   Lần tiếp theo: **Xin vía sáng nay**.
-   Tiếp theo: **Xin vía chiều nay**.
-   Tiếp theo: **Xin vía tối nay**.

Đề xuất triển khai để tránh tiêu đề sai thời gian: lần đầu luôn dùng
"Xin vía hôm nay"; các lần tiếp theo chọn sáng/chiều/tối theo giờ thực
tế tại Việt Nam. Nếu sản phẩm muốn bắt buộc thứ tự theo lần bấm (lần 2
sáng, lần 3 chiều, lần 4 tối) thì đây là một chế độ campaign riêng cần
được xác nhận trước khi code.

Khung thời gian đề xuất:

-   Sáng: 05:00--11:59.
-   Chiều: 12:00--17:59.
-   Tối: 18:00--04:59.

Đây là đề xuất logic triển khai; có thể thay đổi trong cấu hình sản
phẩm.

### 3.3. Xin vía cửa hàng hoặc sale

Sau khi người dùng bấm vào cửa hàng hoặc văn phòng sale trong phố 3D:

1.  Mở thông tin công khai của cửa hàng/sale.
2.  Có nút Gửi vía.
3.  Người dùng chọn loại vía phù hợp, ví dụ:
    -   Đông khách.
    -   Nhiều đơn.
    -   Chốt deal.
    -   Đạt KPI.
    -   Gặp khách hàng tốt.
    -   Buôn may bán đắt.
4.  Gửi vía không cần đăng nhập.
5.  Nếu cửa hàng/sale bật tự động gửi vía lại, hệ thống gửi một lời chúc
    tương ứng.
6.  Giao diện phải ghi rõ đây là **phản hồi tự động**, không giả lập như
    chủ cửa hàng đang trực tiếp nhắn tin.

Nếu chủ cửa hàng/sale tắt tự động gửi vía lại, hiển thị phản hồi cảm ơn
trung tính từ hệ thống.

### 3.4. Giới hạn và chống spam

-   Xin vía không nên bị khóa cứng theo số lượt thông thường.
-   Áp dụng giới hạn tốc độ ở mức kỹ thuật để chống bot/spam.
-   Không biến số lượt xin vía thành tiền, phần thưởng tiền mặt hoặc cơ
    chế cá cược.
-   Không yêu cầu đăng nhập chỉ để xin vía.
-   Nếu mất mạng, có thể hiển thị lời chúc dự phòng đã cache; không được
    nói rằng cửa hàng đã nhận vía nếu request chưa gửi thành công.

------------------------------------------------------------------------

## 4. Cơ chế Ghé phố -- Gửi vía -- Nhận vía

### 4.1. Ghé phố

Người dùng khám phá phố 3D, chạm vào các điểm như:

-   Quán cafe.
-   Cửa hàng bán lẻ.
-   Shop thời trang.
-   Cửa hàng tạp hóa/minimart.
-   Văn phòng sale.
-   Các loại cửa hàng hoặc văn phòng khác.

Khách chưa đăng nhập vẫn có thể xem thông tin công khai và ghé thăm.

### 4.2. Gửi vía

Từ cửa hàng hoặc văn phòng sale, người dùng có thể gửi vía với loại lời
chúc phù hợp. Nội dung mẫu nên ngắn, vui và tích cực.

### 4.3. Nhận vía

Cửa hàng/sale có thể cấu hình chế độ tự động gửi vía lại. Ví dụ:

-   Khách gửi vía "Đông khách" → phản hồi "Chúc bạn hôm nay đông khách,
    đơn về liên tục nhé!".
-   Khách gửi vía "Chốt deal" → phản hồi "Chúc bạn chốt deal lớn, khách
    gật đầu nhanh!".
-   Khách gửi vía "Đạt KPI" → phản hồi "Chúc bạn bứt tốc KPI, về đích
    thật đẹp!".

Phản hồi tự động phải có nhãn rõ ràng. Người nhận có thể tùy chỉnh nội
dung theo vai trò.

------------------------------------------------------------------------

## 5. Kể khổ

### 5.1. Mục đích

Kể khổ là nơi chủ kinh doanh và nhân viên sale chia sẻ những khó khăn,
tình huống áp lực hoặc chuyện dở khóc dở cười trong công việc. Mục tiêu
là tạo sự đồng cảm và giải tỏa tâm lý, không biến thành nơi công kích
hoặc than phiền tiêu cực kéo dài.

### 5.2. Popup soạn bài

Khi bấm Kể khổ:

-   Mở popup hoặc bottom sheet tùy kích thước màn hình.
-   Có ô nhập nội dung ngắn.
-   Gợi ý nội dung vui, gần gũi.
-   Có thể chọn chủ đề hoặc sticker.
-   Có thể đính kèm ảnh/video nếu được bật trong phạm vi MVP.
-   Có xem trước nội dung.
-   Khi nhấn Đăng mới yêu cầu đăng nhập.
-   Nếu chưa đăng nhập, giữ lại bản nháp trong phiên và đưa người dùng
    tới đăng nhập; sau đăng nhập quay lại đúng nội dung đang soạn.

Nội dung nên giới hạn độ dài hợp lý. Đề xuất ban đầu tối đa 500 ký tự,
có thể điều chỉnh.

### 5.3. Tương tác trên bài Kể khổ

-   Thả cảm xúc.
-   Bình luận (nếu đã đăng nhập).
-   Gửi vía động viên.
-   Chia sẻ bài.
-   Báo cáo nội dung vi phạm.

------------------------------------------------------------------------

## 6. Khoe doanh thu / Khoe deal

### 6.1. Theo vai trò

**Chủ quán/chủ kinh doanh:**

-   Khoe doanh thu.
-   Khoe số đơn.
-   Khoe ngày bán tốt.
-   Khoe mốc kinh doanh hoặc thành tích cửa hàng.

**Nhân viên sale:**

-   Khoe deal.
-   Khoe hợp đồng.
-   Khoe KPI.
-   Khoe số khách hoặc thành tích bán hàng.

### 6.2. Popup soạn bài

-   Chọn loại thành tích phù hợp với vai trò.
-   Nội dung chia sẻ ngắn.
-   Giá trị doanh thu/deal là tùy chọn, không bắt buộc.
-   Có lựa chọn ẩn số tiền hoặc chỉ hiển thị khoảng/mốc thành tích.
-   Có xem trước bài đăng.
-   Khi bấm Đăng mới yêu cầu đăng nhập.
-   Nếu chưa đăng nhập, giữ nội dung nháp và quay lại sau xác thực.

### 6.3. Nguyên tắc riêng tư và độ tin cậy

-   Mặc định không công khai số tiền nếu người dùng chưa chủ động chọn.
-   Không bắt buộc chia sẻ doanh thu hoặc giá trị hợp đồng.
-   Không hiển thị thông tin khách hàng, số điện thoại, hợp đồng mật
    hoặc dữ liệu nội bộ.
-   Số liệu người dùng tự khai phải được phân biệt với số liệu đã xác
    minh.
-   Không gắn nhãn "đã xác minh" nếu không có cơ chế xác minh thực tế.
-   Tránh bảng xếp hạng chỉ dựa trên doanh thu tuyệt đối, vì dễ tạo áp
    lực và so sánh tiêu cực.

------------------------------------------------------------------------

## 7. Bảng tin cộng đồng duy nhất

### 7.1. Bố cục

Bảng tin là một luồng nội dung thống nhất, các bài Kể khổ và Khoe doanh
thu/Deal xuất hiện xen kẽ.

### 7.2. Thẻ bài viết

Mỗi thẻ bài có thể gồm:

-   Avatar và tên hiển thị.
-   Vai trò: Chủ cửa hàng, Chủ kinh doanh hoặc Sale.
-   Loại nội dung: Kể khổ hoặc Khoe thành tích.
-   Nội dung văn bản.
-   Ảnh/video nếu có.
-   Thời gian đăng.
-   Cảm xúc.
-   Bình luận.
-   Gửi vía.
-   Chia sẻ.
-   Báo cáo.

### 7.3. Sắp xếp và lọc

Đề xuất các lựa chọn:

-   Mới nhất.
-   Đang được quan tâm.
-   Tất cả.
-   Kể khổ.
-   Khoe thành tích.
-   Xin vía công khai (nếu có).

Không tách Kể khổ và Khoe thành hai trang feed độc lập.

------------------------------------------------------------------------

## 8. Phố 3D và cửa hàng/văn phòng 3D

### 8.1. Mục tiêu

Phố 3D là yếu tố tạo tò mò và nhận diện riêng của Xin Vía. Người dùng
có thể khám phá các cửa hàng và văn phòng sale, từ đó ghé thăm và gửi
vía.

### 8.2. Nguyên tắc diện tích

-   Trên mobile: hiển thị phố 3D đủ tạo cảm giác khám phá nhưng không
    chiếm hết màn hình.
-   Trên iPad: mở rộng khu vực phố 3D, đặc biệt ở chế độ ngang.
-   Trên desktop/màn hình lớn: có thể dành diện tích rộng hơn cho phố 3D
    để tăng hấp dẫn.
-   Ở mọi kích thước, CTA Xin vía phải luôn nổi bật và dễ thao tác.
-   Không để mô hình 3D, cửa hàng, bảng hiệu hoặc hiệu ứng che nút Xin
    vía.
-   Ưu tiên CTA có độ tương phản cao, vị trí ổn định và không bị các
    thành phần khác cạnh tranh.

### 8.3. Tạo cửa hàng/văn phòng 3D

Chỉ người dùng đăng nhập mới được:

-   Tạo cửa hàng 3D.
-   Tạo văn phòng sale 3D.
-   Đặt tên và chọn mẫu.
-   Cấu hình thông tin công khai.
-   Bật/tắt tự động gửi vía lại.
-   Chọn mẫu lời chúc theo vai trò.
-   Chỉnh sửa tài sản 3D của mình.

Khách chưa đăng nhập vẫn có thể ghé thăm tài sản công khai của người
khác.

### 8.4. Hiệu năng và fallback

-   Tải ảnh/thumbnail trước, tải scene 3D sau.
-   Lazy-load các mô hình không nằm trong vùng nhìn.
-   Có chế độ 2D khi thiết bị không hỗ trợ WebGL hoặc hiệu năng thấp.
-   Hỗ trợ giảm chuyển động theo thiết lập thiết bị.
-   Không để 3D làm chậm chức năng Xin vía hoặc feed.

------------------------------------------------------------------------

## 9. Thiết kế responsive theo thiết bị

### 9.1. Mobile

Ưu tiên một cột, thao tác bằng ngón cái.

-   Header gọn.
-   Phố 3D/hero ở phần đầu.
-   CTA Xin vía là hành động trung tâm.
-   Ba hành động Kể khổ -- Xin vía -- Khoe dễ nhìn.
-   Feed chung nằm ngay bên dưới.
-   Popup soạn bài dạng bottom sheet.
-   Không bắt buộc đăng nhập để đọc hoặc xin vía.

### 9.2. iPad

Bố cục thích ứng theo chiều dọc/ngang:

**iPad dọc:** - Nội dung một cột hoặc hai vùng gọn. - Phố 3D đủ lớn để
tạo tò mò. - CTA Xin vía đặt ở vị trí trung tâm, không bị chìm.

**iPad ngang:** - Có thể dùng hai cột. - Phố 3D rộng hơn. - Feed và khu
vực khám phá được bố trí cạnh nhau hoặc theo các vùng rõ ràng. - Popup
có kích thước vừa phải, không phủ toàn bộ màn hình nếu không cần thiết.

### 9.3. Desktop

Đề xuất bố cục ba vùng:

-   Cột trái: điều hướng, hồ sơ/điểm đến, nút tạo cửa hàng/văn phòng nếu
    người dùng đăng nhập.
-   Khu vực trung tâm: Phố 3D và CTA Xin vía; bên dưới là ô tạo bài
    nhanh và feed chung.
-   Cột phải: nội dung phụ trợ như hoạt động cộng đồng, lời vía nhanh,
    thử thách hoặc thông tin khám phá.

Phố 3D có thể rộng và cao hơn mobile, nhưng nút Xin vía phải là điểm
nhấn rõ nhất.

### 9.4. Màn hình lớn / 2K / 4K

-   Mở rộng chiều ngang khu vực phố 3D.
-   Không kéo giãn các thẻ nội dung quá rộng.
-   Giữ giới hạn chiều rộng đọc tối ưu cho feed.
-   Có thể thêm nhiều cửa hàng trong cảnh 3D, nhưng không làm rối CTA.
-   Không dùng diện tích lớn để nhồi thêm widget hoặc bảng số liệu không
    cần thiết.

### 9.5. Tỷ lệ diện tích 3D

Các tỷ lệ từng được trao đổi là định hướng thiết kế, không phải thông số
cố định đã khóa. Đề xuất cần kiểm thử bằng prototype thực tế:

  -----------------------------------------------------------------------
  Thiết bị                            Định hướng
  ----------------------------------- -----------------------------------
  Mobile                              3D vừa đủ tạo tò mò, không lấn CTA
                                      và feed

  iPad dọc                            3D lớn hơn mobile, CTA rõ

  iPad ngang                          3D chiếm vùng nổi bật, có thể
                                      khoảng 55--65% khu vực hero

  Desktop                             3D có thể chiếm khoảng 60--70% vùng
                                      hero đầu trang

  Màn hình lớn                        Mở rộng cảnh 3D theo chiều ngang,
                                      giới hạn chiều rộng nội dung feed
  -----------------------------------------------------------------------

Tỷ lệ cuối cùng cần được xác nhận bằng usability test; không được áp
dụng cứng nếu làm giảm độ nổi bật của Xin vía.

------------------------------------------------------------------------

## 10. Danh sách màn hình chức năng

Danh sách màn hình tham chiếu cho thiết kế và phát triển:

1.  Trang chủ.
2.  Popup Xin vía Thần Tài lần đầu.
3.  Popup Xin vía theo thời điểm.
4.  Phố 3D.
5.  Chi tiết cửa hàng/văn phòng sale.
6.  Gửi vía.
7.  Nhận vía tự động.
8.  Bảng tin chung.
9.  Popup Kể khổ.
10. Popup Khoe doanh thu/Deal.
11. Đăng nhập/đăng ký theo hành động.
12. Hồ sơ cá nhân.
13. Tạo cửa hàng 3D.
14. Tạo văn phòng sale 3D.
15. Cấu hình tự động gửi vía.
16. Nhiệm vụ/thử thách cộng đồng.
17. Bảng xếp hạng hoặc thành tích cộng đồng.
18. Thông báo.
19. Báo cáo nội dung và trạng thái kiểm duyệt.
20. Khu vực quản trị/kiểm duyệt.

Các màn hình 3D và bảng xếp hạng là phần mở rộng; MVP nên ưu tiên luồng
xin vía, feed chung và đăng bài.

------------------------------------------------------------------------

## 11. Yêu cầu chức năng (FR)

  -----------------------------------------------------------------------
  Mã                      Chức năng               Yêu cầu chính
  ----------------------- ----------------------- -----------------------
  FR-01                   Trang chủ               Guest truy cập được,
                                                  không login wall

  FR-02                   Xin vía Thần Tài        Xin vía tức thì, không
                                                  đăng nhập

  FR-03                   Tiêu đề theo thời điểm  Lần đầu "Xin vía hôm
                                                  nay", sau đó theo buổi

  FR-04                   Xin vía cửa hàng/sale   Guest gửi vía tới điểm
                                                  3D

  FR-05                   Tự động gửi vía lại     Có cấu hình bật/tắt và
                                                  nhãn phản hồi tự động

  FR-06                   Ghé phố                 Khám phá cửa hàng/văn
                                                  phòng 3D không cần tài
                                                  khoản

  FR-07                   Kể khổ                  Popup nội dung ngắn;
                                                  login tại bước đăng

  FR-08                   Khoe thành tích         Theo vai trò chủ quán
                                                  hoặc sale; giá trị tùy
                                                  chọn

  FR-09                   Feed chung              Kể khổ và Khoe xen kẽ
                                                  trong một feed

  FR-10                   Login theo hành động    Chỉ yêu cầu khi cần
                                                  danh tính/lưu dữ liệu

  FR-11                   Hồ sơ 3D                Tạo cửa hàng/văn phòng
                                                  cần tài khoản

  FR-12                   Chống spam              Rate limit, báo cáo và
                                                  kiểm duyệt
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 12. Luồng người dùng chính

### Luồng A -- Xin vía Thần Tài

Trang chủ → Bấm Xin vía → Popup Thần Tài → Nhận lời chúc → Hiệu ứng nhận
vía → Đóng popup hoặc khám phá phố.

Không cần đăng nhập.

### Luồng B -- Ghé phố và gửi vía

Trang chủ → Phố 3D → Chạm cửa hàng/sale → Xem chi tiết → Gửi vía → Nhận
phản hồi tự động (nếu bật) → Quay lại phố/feed.

Không cần đăng nhập.

### Luồng C -- Kể khổ

Trang chủ → Kể khổ → Popup nhập nội dung → Xem trước → Bấm Đăng → Yêu
cầu đăng nhập → Quay lại bản nháp → Xác nhận đăng.

### Luồng D -- Khoe doanh thu/deal

Trang chủ → Khoe → Chọn vai trò/loại thành tích → Nhập nội dung và giá
trị tùy chọn → Chọn hiển thị/ẩn số tiền → Xem trước → Bấm Đăng → Yêu cầu
đăng nhập nếu chưa có tài khoản.

### Luồng E -- Tạo cửa hàng/văn phòng 3D

Trang chủ/Hồ sơ → Tạo cửa hàng hoặc văn phòng → Yêu cầu đăng nhập → Chọn
mẫu → Đặt tên/cấu hình → Lưu → Hiển thị trong phố 3D.

------------------------------------------------------------------------

## 13. Dữ liệu và thực thể đề xuất

  -----------------------------------------------------------------------
  Entity                              Trường chính
  ----------------------------------- -----------------------------------
  users                               id, role, display_name, avatar,
                                      created_at, status

  guest_sessions                      anonymous_id_hash, first_seen,
                                      last_seen, expiry

  places                              id, owner_id, place_type, title,
                                      scene_template, public_status

  wish_templates                      id, source_type, role_target,
                                      wish_type, text, animation_key,
                                      active

  wish_events                         id, source, target_place_id,
                                      guest_or_user_hash, wish_type,
                                      timestamp, auto_reply_id

  posts                               id, author_id, type, role, body,
                                      media, visibility, status

  achievements                        id, post_id, metric_type, amount,
                                      display_mode, verification_status

  reactions                           id, post_id, user_id, reaction_type

  moderation_reports                  id, target_type, target_id, reason,
                                      reporter_id, state

  audit_logs                          actor, action, object, timestamp
  -----------------------------------------------------------------------

Đây là mô hình dữ liệu định hướng, cần được rà soát khi thiết kế backend
và database chính thức.

------------------------------------------------------------------------

## 14. API đề xuất

  -------------------------------------------------------------------------------
  Method            Endpoint                  Auth              Mô tả
  ----------------- ------------------------- ----------------- -----------------
  GET               /api/home                 Không             Hero, feed và cấu
                                                                hình trang chủ

  POST              /api/wishes/deity         Không             Nhận lời chúc
                                                                Thần Tài, có rate
                                                                limit

  GET               /api/places               Không             Danh sách điểm
                                                                phố 3D

  GET               /api/places/{id}          Không             Thông tin công
                                                                khai của điểm

  POST              /api/places/{id}/wishes   Không             Gửi vía và trả
                                                                kết
                                                                quả/auto-reply

  GET               /api/posts                Không             Feed chung và bộ
                                                                lọc

  POST              /api/posts                Có                Đăng Kể khổ/Khoe

  POST              /api/places               Có                Tạo cửa hàng/văn
                                                                phòng 3D

  PATCH             /api/places/{id}          Có, chủ sở hữu    Cập nhật thông
                                                                tin và auto-reply

  POST              /api/reports              Theo chính sách   Báo cáo nội dung
  -------------------------------------------------------------------------------

API là đề xuất ban đầu, chưa phải hợp đồng API đã được backend xác nhận.

------------------------------------------------------------------------

## 15. Phi chức năng, riêng tư và an toàn

-   Mobile-first, hỗ trợ nhiều kích thước màn hình.
-   Tải 3D theo nhu cầu; có fallback 2D.
-   Xin vía phải hoạt động độc lập với việc tải scene 3D.
-   Chống XSS/CSRF và kiểm soát quyền sở hữu tài sản.
-   Không thu thập số điện thoại chỉ để xin vía.
-   Doanh thu/deal mặc định không công khai nếu người dùng chưa chọn.
-   Phân biệt số liệu tự khai và số liệu đã xác minh.
-   Có chức năng báo cáo, chặn và kiểm duyệt.
-   Không khuyến khích khai khống doanh thu.
-   Không cho phép tiết lộ thông tin khách hàng hoặc hợp đồng mật.
-   Không dùng bảng xếp hạng gây áp lực chỉ dựa trên doanh thu tuyệt
    đối.
-   Lời chúc Thần Tài/vía là nội dung giải trí, không cam kết tài lộc.

------------------------------------------------------------------------

## 16. Analytics và chỉ số đánh giá

Các sự kiện cần đo:

-   home_view.
-   wish_open.
-   wish_received.
-   place_visit.
-   wish_sent_place.
-   story_compose.
-   achievement_compose.
-   post_published.
-   signup_after_action.
-   feed_engagement.

KPI thử nghiệm:

-   Tỷ lệ khách mới bấm Xin vía.
-   Tỷ lệ hoàn tất nhận vía.
-   Tỷ lệ ghé phố sau khi xin vía.
-   Tỷ lệ gửi vía cho cửa hàng/sale.
-   Tỷ lệ quay lại sau 7 ngày.
-   Tỷ lệ khách chuyển thành thành viên khi muốn đăng bài.
-   Tỷ lệ phản hồi tự động thành công.
-   Tỷ lệ lỗi WebGL theo thiết bị.

Không đánh giá thành công chỉ bằng số lần bấm xin vía; cần đo mức độ
quay lại và tương tác cộng đồng có ý nghĩa.

------------------------------------------------------------------------

## 17. Kịch bản nghiệm thu UAT

  -----------------------------------------------------------------------
  ID                      Tình huống              Kết quả mong đợi
  ----------------------- ----------------------- -----------------------
  UAT-01                  Guest mở trang lần đầu  Thấy trang chủ, Xin
                                                  vía; không bị yêu cầu
                                                  đăng nhập

  UAT-02                  Guest xin vía Thần Tài  Nhận lời chúc ngay,
                                                  không cần form

  UAT-03                  Guest xin lần tiếp theo Tiêu đề phù hợp "Xin
                          buổi sáng               vía sáng nay"

  UAT-04                  Guest mở và xin vía     Tiêu đề không sai thời
                          buổi tối                điểm

  UAT-05                  Guest chạm cửa hàng 3D  Xem chi tiết và gửi vía
                                                  được

  UAT-06                  Cửa hàng bật auto-reply Guest nhận phản hồi có
                                                  nhãn tự động

  UAT-07                  Cửa hàng tắt auto-reply Không giả lập chủ cửa
                                                  hàng đã trả lời

  UAT-08                  Guest soạn Kể khổ và    Login được yêu cầu đúng
                          bấm Đăng                thời điểm, draft được
                                                  giữ

  UAT-09                  Sale chọn Khoe          Có mẫu deal/KPI và tùy
                                                  chọn ẩn giá trị

  UAT-10                  Chủ quán chọn Khoe      Có mẫu doanh thu/số đơn
                                                  và tùy chọn ẩn

  UAT-11                  Guest đọc feed          Kể khổ và Khoe cùng
                                                  xuất hiện trong một
                                                  feed

  UAT-12                  Thiết bị không hỗ trợ   Có fallback 2D; vẫn xin
                          WebGL                   vía được
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 18. Lộ trình triển khai

### MVP / P0

-   Trang chủ.
-   Xin vía Thần Tài cho guest.
-   Ba hành động Kể khổ -- Xin vía -- Khoe.
-   Popup Kể khổ và Khoe.
-   Đăng nhập theo hành động.
-   Feed chung.
-   Phố 3D ở mức preview/scene mẫu.
-   Ghé điểm và gửi vía.
-   Auto-reply cơ bản.

### P1

-   Phố 3D tương tác đầy đủ.
-   Template cửa hàng/văn phòng sale.
-   Cấu hình auto-reply.
-   Hồ sơ cá nhân và thành tích.
-   Nhiệm vụ cộng đồng nhẹ.
-   Thông báo.

### P2

-   Trang trí 3D nâng cao.
-   Cá nhân hóa khám phá.
-   Thành tích cộng đồng.
-   Video và nội dung phong phú hơn.
-   Các tính năng cộng đồng nâng cao sau khi có dữ liệu sử dụng.

------------------------------------------------------------------------

## 19. Các quyết định cần xác nhận trước khi phát triển

1.  **Tiêu đề Xin vía:** Theo thời điểm thực tế hay theo thứ tự lần bấm
    cố định? Đề xuất: lần đầu cố định, các lần sau theo thời điểm thực
    tế.
2.  **Guest gửi lời chúc:** Đề xuất chọn mẫu có sẵn; nếu cho nhập tự do
    thì giới hạn ký tự và lọc spam.
3.  **Số lượt xin vía:** Đề xuất không khóa cứng với người dùng thật;
    chỉ rate-limit chống bot.
4.  **Bài Xin vía trên feed:** Đề xuất chỉ xuất hiện khi người dùng chủ
    động chọn đăng công khai và đã đăng nhập.
5.  **Cửa hàng 3D:** Đề xuất dùng mẫu dựng sẵn trong MVP, tùy biến sâu
    triển khai sau.
6.  **Auto-reply:** Phải ghi rõ là tự động; chủ sở hữu có quyền bật/tắt
    và chỉnh mẫu.

------------------------------------------------------------------------

## 20. Tài sản thiết kế đã tạo trong cuộc trao đổi

Các mockup đã được tạo theo định hướng:

-   Trang chủ Xin Vía.
-   Xin vía Thần Tài.
-   Xin vía theo thời điểm.
-   Phố 3D và cửa hàng/văn phòng sale.
-   Popup Kể khổ.
-   Popup Khoe doanh thu/Khoe deal.
-   Bảng tin chung.
-   Gửi vía và nhận vía.
-   Các màn hình chức năng mobile.
-   Bố cục desktop và iPad.
-   Responsive theo kích thước màn hình.

Các ảnh tách riêng đã tạo trong phiên làm việc:

-   `Chot_Via_Desktop.png`
-   `Chot_Via_Mobile.png`
-   `Chot_Via_iPad.png`

Lưu ý: các mockup là hình ảnh định hướng UI/UX, không phải source code
giao diện hoặc ứng dụng 3D tương tác. Tài liệu Markdown này tổng hợp yêu
cầu và quyết định thiết kế bằng văn bản; các ảnh không được nhúng trực
tiếp vào file vì cần giữ riêng từng tài sản ảnh.

------------------------------------------------------------------------

## 21. Kết luận định hướng sản phẩm

Xin Vía nên được phát triển như một **cộng đồng giải trí và động viên
tinh thần cho người kinh doanh và nhân viên sale**.

Trải nghiệm quan trọng nhất:

1.  Mở trang là thấy Xin vía.
2.  Bấm là nhận vía ngay, không cần đăng nhập.
3.  Có thể ghé phố 3D và gửi vía cho cửa hàng/sale.
4.  Có một bảng tin chung để kể khổ, khoe thành tích và tương tác.
5.  Chỉ đăng nhập khi muốn đăng bài, lưu thành tích hoặc tạo tài sản 3D.

**Nguyên tắc thiết kế cuối cùng:** Phố 3D tạo tò mò; Xin vía tạo hành
động; bảng tin tạo cộng đồng; hồ sơ cá nhân tạo niềm tin. Không để 3D
hoặc các tính năng phụ làm lu mờ trải nghiệm Xin vía.


# 22. Thư viện thiết kế giao diện đã tạo

Phần này bổ sung các hình ảnh concept/mockup đã được tạo trong quá trình trao đổi. Ảnh được lưu trong thư mục `Chot_Via_Design_Assets/` với tên file không dấu để dễ quản lý trong repository. Đây là hình ảnh thiết kế tham khảo, không phải source code hoặc prototype tương tác. Một số hình là concept tổng quan hoặc hình ảnh truyền thông, không phải màn hình sản phẩm đã chốt.

| STT | Nhóm thiết kế | File ảnh | Ghi chú |
|---:|---|---|---|
| 1 | Tổng quan cộng đồng / trang chủ desktop | [`cong_dong_chu_quan_overview.png`](Chot_Via_Design_Assets/cong_dong_chu_quan_overview.png) | Mockup/concept |
| 2 | Concept trang chủ mobile | [`home_mobile_concept.png`](Chot_Via_Design_Assets/home_mobile_concept.png) | Mockup/concept |
| 3 | Trang chủ desktop với phố 3D và Xin vía | [`desktop_3d_home.png`](Chot_Via_Design_Assets/desktop_3d_home.png) | Mockup/concept |
| 4 | Giao diện Kể khổ desktop | [`ke_kho_desktop.png`](Chot_Via_Design_Assets/ke_kho_desktop.png) | Mockup/concept |
| 5 | Các màn hình app mobile / gamification | [`mobile_app_feature_grid.png`](Chot_Via_Design_Assets/mobile_app_feature_grid.png) | Mockup/concept |
| 6 | Concept ứng dụng cộng đồng nhiều màn hình | [`social_app_concept.png`](Chot_Via_Design_Assets/social_app_concept.png) | Mockup/concept |
| 7 | Showcase desktop, tablet và mobile | [`responsive_app_showcase.png`](Chot_Via_Design_Assets/responsive_app_showcase.png) | Mockup/concept |
| 8 | Hình ảnh cộng đồng / event thương hiệu | [`community_event_concept.png`](Chot_Via_Design_Assets/community_event_concept.png) | Mockup/concept |
| 9 | Feed chung Kể khổ và Khoe | [`unified_feed_desktop.png`](Chot_Via_Design_Assets/unified_feed_desktop.png) | Mockup/concept |
| 10 | Dashboard desktop với phố 3D | [`desktop_3d_dashboard.png`](Chot_Via_Design_Assets/desktop_3d_dashboard.png) | Mockup/concept |
| 11 | Tập hợp màn hình chức năng mobile | [`feature_screens_mobile.png`](Chot_Via_Design_Assets/feature_screens_mobile.png) | Mockup/concept |
| 12 | Concept khoe doanh thu / thành tích | [`community_achievement_concept.png`](Chot_Via_Design_Assets/community_achievement_concept.png) | Mockup/concept |
| 13 | Phố Thần Tài 3D | [`3d_lucky_street.png`](Chot_Via_Design_Assets/3d_lucky_street.png) | Mockup/concept |
| 14 | Phố 3D phiên bản mobile | [`3d_lucky_town_mobile.png`](Chot_Via_Design_Assets/3d_lucky_town_mobile.png) | Mockup/concept |
| 15 | Dashboard cộng đồng và phố 3D | [`3d_community_dashboard.png`](Chot_Via_Design_Assets/3d_community_dashboard.png) | Mockup/concept |
| 16 | Giao diện mobile cộng đồng bán hàng | [`seller_community_mobile.png`](Chot_Via_Design_Assets/seller_community_mobile.png) | Mockup/concept |
| 17 | Bộ giao diện cộng đồng seller | [`seller_community_ui.png`](Chot_Via_Design_Assets/seller_community_ui.png) | Mockup/concept |
| 18 | Showcase UI app mobile nhiều màn hình | [`mobile_ui_showcase.png`](Chot_Via_Design_Assets/mobile_ui_showcase.png) | Mockup/concept |
| 19 | Trang chủ cộng đồng người bán hàng | [`seller_community_home.png`](Chot_Via_Design_Assets/seller_community_home.png) | Mockup/concept |

## 22.1. Xem nhanh các thiết kế

### 1. Tổng quan cộng đồng / trang chủ desktop

![Tổng quan cộng đồng / trang chủ desktop](Chot_Via_Design_Assets/cong_dong_chu_quan_overview.png)

### 2. Concept trang chủ mobile

![Concept trang chủ mobile](Chot_Via_Design_Assets/home_mobile_concept.png)

### 3. Trang chủ desktop với phố 3D và Xin vía

![Trang chủ desktop với phố 3D và Xin vía](Chot_Via_Design_Assets/desktop_3d_home.png)

### 4. Giao diện Kể khổ desktop

![Giao diện Kể khổ desktop](Chot_Via_Design_Assets/ke_kho_desktop.png)

### 5. Các màn hình app mobile / gamification

![Các màn hình app mobile / gamification](Chot_Via_Design_Assets/mobile_app_feature_grid.png)

### 6. Concept ứng dụng cộng đồng nhiều màn hình

![Concept ứng dụng cộng đồng nhiều màn hình](Chot_Via_Design_Assets/social_app_concept.png)

### 7. Showcase desktop, tablet và mobile

![Showcase desktop, tablet và mobile](Chot_Via_Design_Assets/responsive_app_showcase.png)

### 8. Hình ảnh cộng đồng / event thương hiệu

![Hình ảnh cộng đồng / event thương hiệu](Chot_Via_Design_Assets/community_event_concept.png)

### 9. Feed chung Kể khổ và Khoe

![Feed chung Kể khổ và Khoe](Chot_Via_Design_Assets/unified_feed_desktop.png)

### 10. Dashboard desktop với phố 3D

![Dashboard desktop với phố 3D](Chot_Via_Design_Assets/desktop_3d_dashboard.png)

### 11. Tập hợp màn hình chức năng mobile

![Tập hợp màn hình chức năng mobile](Chot_Via_Design_Assets/feature_screens_mobile.png)

### 12. Concept khoe doanh thu / thành tích

![Concept khoe doanh thu / thành tích](Chot_Via_Design_Assets/community_achievement_concept.png)

### 13. Phố Thần Tài 3D

![Phố Thần Tài 3D](Chot_Via_Design_Assets/3d_lucky_street.png)

### 14. Phố 3D phiên bản mobile

![Phố 3D phiên bản mobile](Chot_Via_Design_Assets/3d_lucky_town_mobile.png)

### 15. Dashboard cộng đồng và phố 3D

![Dashboard cộng đồng và phố 3D](Chot_Via_Design_Assets/3d_community_dashboard.png)

### 16. Giao diện mobile cộng đồng bán hàng

![Giao diện mobile cộng đồng bán hàng](Chot_Via_Design_Assets/seller_community_mobile.png)

### 17. Bộ giao diện cộng đồng seller

![Bộ giao diện cộng đồng seller](Chot_Via_Design_Assets/seller_community_ui.png)

### 18. Showcase UI app mobile nhiều màn hình

![Showcase UI app mobile nhiều màn hình](Chot_Via_Design_Assets/mobile_ui_showcase.png)

### 19. Trang chủ cộng đồng người bán hàng

![Trang chủ cộng đồng người bán hàng](Chot_Via_Design_Assets/seller_community_home.png)

## 22.2. Phạm vi và lưu ý

- Thư viện hiện có gồm concept trang chủ, phố 3D, Kể khổ desktop, feed chung, dashboard, giao diện app mobile và các bảng showcase responsive.
- Không phải tất cả hình đều là bản cuối cùng hoặc cùng một phiên bản thiết kế; một số hình là phương án khám phá ý tưởng được tạo ở các giai đoạn khác nhau.
- Hình ảnh không được xem là đặc tả chính xác về kích thước, trạng thái tương tác, nội dung động hoặc logic backend. Khi triển khai cần dùng SRS và chốt lại design system, breakpoint, component và luồng UX.
- Các ảnh banner AIBAT không thuộc thư viện UI Xin Vía nên không được gộp vào bộ asset này.
