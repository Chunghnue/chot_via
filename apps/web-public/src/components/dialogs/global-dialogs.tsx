'use client';

import { ComposerDialog } from './composer-dialog';
import { LoginSheet } from './login-sheet';
import { PlaceSheet } from './place-sheet';
import { ReportDialog } from './report-dialog';
import { WishBurst } from './wish-burst';

/** Các popup dùng chung toàn app (nổ vía, soạn bài, đăng nhập, điểm trên phố, báo cáo) — mở bằng Redux `ui`/`composer`. */
export function GlobalDialogs() {
  return (
    <>
      <WishBurst />
      <ComposerDialog />
      <PlaceSheet />
      <LoginSheet />
      <ReportDialog />
    </>
  );
}
