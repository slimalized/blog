import { nanoid } from "nanoid";
import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Custom React hook to manage the lifecycle and presence of temporary UI elements,
 * typically used for visual feedback like "ripples."
 * It provides a mechanism to add new elements to the DOM model (by using unique IDs)
 * and automatically removes them after a specified duration.
 *
 * @param rippleDuration - Ripple display duration (ms). Default rippleDuration is 2000[ms].
 * @returns An object containing:
 * - `ripples`: A `Set<string>` containing the unique IDs of all currently active ripple elements.
 * These IDs represent the ripple elements that are currently mounted in the DOM.
 * - `addRipple`: A function to trigger the creation and addition of a new ripple element.
 * Calling this function adds a new unique ID to the `ripples` set,
 * which will automatically be removed after `rippleDuration`, causing the element to unmount.
 */
export const useRipples = (rippleDuration = 2000) => {
	const [ripples, setRipples] = useState<Set<string>>(new Set());
	const timersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());

	// Clear all timers when the component is unmounted.
	useEffect(() => {
		return () => {
			for (const timeoutID of timersRef.current.values()) {
				clearTimeout(timeoutID);
			}
			timersRef.current.clear();
		};
	}, []);

	const addRipple = useCallback(() => {
		const newRippleId = `ripple-id-${nanoid()}`;
		setRipples((prevSet) => new Set(prevSet).add(newRippleId));

		const timer = setTimeout(() => {
			setRipples((prevSet) => {
				const newSet = new Set(prevSet);
				newSet.delete(newRippleId);
				return newSet;
			});
			timersRef.current.delete(newRippleId);
		}, rippleDuration);

		timersRef.current.set(newRippleId, timer);

		return newRippleId;
	}, [rippleDuration]);

	return { ripples, addRipple };
};
