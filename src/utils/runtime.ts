export const BOOT_TIME = new Date();
export const getRuntimeMs = (): number => Date.now() - BOOT_TIME.getTime();
