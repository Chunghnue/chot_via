'use client';

import { ComposerDialog } from './composer-dialog';
import { LoginSheet } from './login-sheet';
import { PlaceSheet } from './place-sheet';
import { ReportDialog } from './report-dialog';
import { WishDialog } from './wish-dialog';

/** Các popup dùng chung toàn app (Xin vía, soạn bài, đăng nhập, điểm trên phố, báo cáo) — mở bằng Redux `ui`/`composer`. */
export function GlobalDialogs() {
  return (
    <>
      <WishDialog />
      <ComposerDialog />
      <PlaceSheet />
      <LoginSheet />
      <ReportDialog />
    </>
  );
}
