/**
 * Trạng thái dáng của Thần Tài trong nghi lễ Thỉnh Thần Tài, dùng chung cho `DeityFlyer` (ảnh bay) và `DeityGlbFigure` (model GLB có xương).
 * Cảnh cập nhật mỗi khung hình; thành phần hiển thị chỉ đọc.
 */
export interface DeityPose {
  /** Mức di chuyển 0..1 và pha bước (rad, tăng đều theo quãng đường đã đi). */
  mv: number;
  ph: number;
  /** Đang đi về phía +x (lật ảnh). */
  flip: boolean;
  /** Các động tác tại chỗ 0..1: gõ cửa, chúc, vung tay tung vàng. */
  knock: number;
  greet: number;
  throwing: number;
  /** Tăng thêm 1 mỗi lần vung tay (cho clip tung vàng của model GLB). */
  throwId: number;
}

export function newPose(): DeityPose {
  return { mv: 0, ph: 0, flip: false, knock: 0, greet: 0, throwing: 0, throwId: 0 };
}
