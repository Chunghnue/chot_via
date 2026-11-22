# Model GLB cho Thần Tài (nghi lễ Thỉnh Thần Tài)

Hiện nhân vật là hoạt ảnh bước đi 8 khung hình của chủ dự án (`apps/web-public/public/images/pho/than-tai-di.webp`, phát bởi `packages/scene-3d/src/deity-walker.tsx`). Có file GLB có xương thì chỉ cần điền một cấu hình, không sửa code khác; code tự dùng GLB thay hoạt ảnh.

## Làm file GLB (một lần)
1. **Ảnh nguồn:** hình "Thần Tài Chúc mừng" trong `docs/reference/design/Bộ 3D Phố Chốt Vía Rực Rỡ.png` (nên dùng bản độ phân giải cao hơn, tốt nhất có thêm mặt sau và mặt hông).
2. **Tạo model 3D từ ảnh** bằng dịch vụ như Meshy, Tripo hoặc Hunyuan3D (cần tài khoản riêng). Chọn kiểu nhân vật, tư thế chữ A hoặc đứng thẳng nếu có tuỳ chọn; xuất `.glb` hoặc `.fbx`, có texture.
3. **Gắn xương và animation** bằng Mixamo (cần tài khoản Adobe): tải lên model, đặt các điểm khớp, tải về các clip có kèm skin (định dạng `.fbx`) rồi nối thành một file `.glb` (Blender: nhập các clip, đổi tên, xuất glTF Binary).
4. **Các clip cần có** (tên có thể khác, điền đúng vào cấu hình): đứng yên (idle), đi bộ (walk, lặp), vẫy tay chúc (wave, một lần), tung vàng (throw, một lần).
5. Chân nhân vật đứng ngang mặt đất ở gốc toạ độ, nhìn về phía +Z, cao khoảng 2,2 đơn vị (hoặc chỉnh `scale`).

## Gắn vào dự án
1. Chép file vào `apps/web-public/public/3d/models/than_tai_nghi_le.glb`.
2. Trong `packages/scene-3d/src/city-assets.ts` đổi `RITUAL_DEITY_GLB` từ `null` thành:
```ts
export const RITUAL_DEITY_GLB: RitualGlb | null = {
  url: '/3d/models/than_tai_nghi_le.glb',
  scale: 1.95,      // đưa model về cao khoảng 4,3 m trong cảnh
  y: 0,             // nâng/hạ để chân chạm đất
  walkSpeed: 1.4,   // tốc độ (m/s) của clip đi bộ ở nhịp 1x, để chân khớp tốc độ thật
  clips: { idle: 'idle', walk: 'walk', wave: 'wave', throw: 'throw' },
};
```
3. Mở Phố 3D, bấm Thỉnh Thần Tài để xem. Chân có trượt thì chỉnh `walkSpeed`; chân không chạm đất thì chỉnh `y`.

Nhân vật dùng GLB vẫn tự quay theo hướng đi, đứng đúng độ cao từng bậc của bệ ở mức thân (không đặt chân từng bậc như bản dựng khối), gõ cửa, chúc, tung vàng theo đúng mốc `RITUAL_BEATS.invoke`.
