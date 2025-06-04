import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Custom React hook to copy a given text to the clipboard.
 *
 * @param text - The text string to be copied to the clipboard.
 * @param duration - The number of milliseconds to keep the copied state (`isCopied` is `true`).
 *   After this time, `isCopied` will revert to `false`. Default duration is 2000[ms].
 * @returns
 * - `isCopied`: Boolean indicating whether the text is currently copied.
 * - `copy`: Async function to copy the provided text to the clipboard.
 */
export const useCopy = (text: string, duration = 2000) => {
	const [isCopied, setIsCopied] = useState<boolean>(false);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	const copy = useCallback(async () => {
		try {
			await navigator.clipboard.writeText(text);
			setIsCopied(true);

			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}

			timerRef.current = setTimeout(() => {
				setIsCopied(false);
				timerRef.current = null;
			}, duration);
		} catch (error) {
			console.error("[useCopy] Failed to copy text: ", error);
			setIsCopied(false);
		}
	}, [text, duration]);

	useEffect(() => {
		return () => {
			if (timerRef.current) {
				clearTimeout(timerRef.current);
			}
		};
	}, []);

	return { isCopied, copy };
};
