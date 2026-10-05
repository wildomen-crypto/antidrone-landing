// Only the static review build supplies a prefix. Normal/local URLs are unchanged.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
export function sitePath(value: string): string {
  return value.startsWith("/") && !value.startsWith("//") ? basePath + value : value;
}
