export const fileKBSize = (fileByteSize: number) => {
	return Math.floor((fileByteSize / 1024) * 100) / 100;
};
