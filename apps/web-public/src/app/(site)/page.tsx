import type { Metadata } from 'next';
import { HomePage } from './home-page';

/** Chỉ trang chủ có canonical về "/" (link tuyệt đối ghép từ metadataBase). */
export const metadata: Metadata = { alternates: { canonical: '/' } };

export default function Page() {
  return <HomePage />;
}
