import { useCallback, useEffect, useRef } from "react";

/**
 * Custom React hook to throttle the execution of a callback function.
 *
 * The callback will only be invoked once per specified interval, regardless of how many times the throttled function is called.
 *
 * @param callback - The function to be executed in a throttled manner.
 * @param wait - The interval in milliseconds to throttle executions. Defaults to 100ms.
 * @returns A throttled version of the callback function.
 */
export const useThrottle = (callback: () => void, wait = 100) => {
	const callbackRef = useRef(callback);
	const timerRef = useRef<NodeJS.Timeout | null>(null);

	useEffect(() => {
		callbackRef.current = callback;
	}, [callback]);

	return useCallback(() => {
		if (timerRef.current) return;

		callbackRef.current();
		timerRef.current = setTimeout(() => {
			timerRef.current = null;
		}, wait);
	}, [wait]);
};
