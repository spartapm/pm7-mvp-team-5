/** 시연용 랜덤 이미지 (picsum) */
export function randomImage(seed: string | number, w = 600, h = 400) {
  return `https://picsum.photos/seed/${encodeURIComponent(String(seed))}/${w}/${h}`;
}

export const COMING_SOON_MESSAGE = "아직 구현 중이에요";
