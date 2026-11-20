import type { PlaceSummary } from '@chot-via/shared';

export interface StreetSceneProps {
  places: PlaceSummary[];
  /** Điểm không khớp tìm kiếm/bộ lọc: hiển thị mờ. */
  dimmedIds: ReadonlySet<string>;
  selectedId: string | null;
  onSelectPlace: (id: string) => void;
  onSelectDeity: () => void;
  labels: { deity: string; deityHint: string; demo: string; open: (place: string) => string; wishCount: (count: number) => string };
  className?: string;
}
