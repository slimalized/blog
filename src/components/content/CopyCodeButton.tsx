import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useCopy } from "../../utils/hooks/useCopy";
import { useRipples } from "../../utils/hooks/useRipples";
import styles from "./CopyCodeButton.module.css";

interface CopyCodeButtonProps {
	code: string;
	codeBlockId: string;
	text?: string;
}

export const CopyCodeButton = ({
	code,
	codeBlockId,
	text = "Code",
}: CopyCodeButtonProps) => {
	const { isCopied, copy } = useCopy(code);
	const { ripples, addRipple } = useRipples();
	const codeBlockRef = useRef<HTMLElement | null>(null);

	useEffect(() => {
		if (codeBlockId) {
			const codeBlock = document.getElementById(codeBlockId);
			if (codeBlock) {
				codeBlockRef.current = codeBlock;
			}
		}
	}, [codeBlockId]);

	const handleClick = async () => {
		await copy(); // Copy code.
		addRipple(); // Trigger ripple animation to code block.
	};

	return (
		<>
			<button
				type="button"
				className={styles["copy-button"]}
				aria-label="copy code button"
				onClick={handleClick}
			>
				<span data-is-copied={isCopied}>Cop</span>
				<span data-is-copied={isCopied}>y</span>
				<span>{text}</span>
			</button>
			{Array.from(ripples).map(
				(rippleId) =>
					codeBlockRef.current &&
					createPortal(
						<div aria-hidden="true" key={rippleId} className={styles.ripple} />,
						codeBlockRef.current,
						rippleId,
					),
			)}
		</>
	);
};
