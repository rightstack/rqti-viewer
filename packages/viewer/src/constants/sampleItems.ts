import { ITEM_TYPE, type ItemsType } from "./itemType";

/**
 * 유형별 대표 문항 identifier.
 * playground / 데모에서 탭·셀렉트로 전환할 때 사용한다.
 */
export interface SampleItem {
  type: ItemsType;
  label: string;
  qtiIdentifier: string;
}

export const SAMPLE_ITEMS: readonly SampleItem[] = [
  {
    type: ITEM_TYPE.SCQ,
    label: "단일 선택형 (SCQ)",
    qtiIdentifier: "i_hnjgpnv4k8rm4mka",
  },
  {
    type: ITEM_TYPE.MCQ,
    label: "다중 선택형 (MCQ)",
    qtiIdentifier: "i_bh2rcz4sfva33bxb",
  },
  {
    type: ITEM_TYPE.GCQ,
    label: "그룹 선택형 (GCQ)",
    qtiIdentifier: "i_iqypqoaiu195zhpl",
  },
  {
    type: ITEM_TYPE.TFQ,
    label: "참/거짓형 (TFQ)",
    qtiIdentifier: "i_9m9bumtq22y0bqfo",
  },
  {
    type: ITEM_TYPE.DDQ,
    label: "드롭다운형 (DDQ)",
    qtiIdentifier: "i_ktmmv31vi3hnjrv9",
  },
  {
    type: ITEM_TYPE.MATCH,
    label: "연결형 (MATCH)",
    qtiIdentifier: "i_fljjjasfugmmldzc",
  },
  {
    type: ITEM_TYPE.SRQ,
    label: "단답형 (SRQ)",
    qtiIdentifier: "i_f08cywvcvnmeagx1",
  },
  {
    type: ITEM_TYPE.CLOZE,
    label: "빈칸 채우기 (CLOZE)",
    qtiIdentifier: "i_lqenbou7mkjktvwo",
  },
  {
    type: ITEM_TYPE.ESSAY,
    label: "서술형 (ESSAY)",
    qtiIdentifier: "i_1m7u6xcu9wdo59lt",
  },
] as const;

/** type → qtiIdentifier 빠른 조회 */
export const SAMPLE_IDS: Partial<Record<ItemsType, string>> = Object.fromEntries(
  SAMPLE_ITEMS.map((item) => [item.type, item.qtiIdentifier]),
);
