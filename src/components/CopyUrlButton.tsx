import { Check, Copy } from "lucide-react";
import { useCopy } from "../utils/hooks/useCopy";
import styles from "./CopyUrlButton.module.css";

export const CopyUrlButton = ({ href }: { href: string }) => {
	const { isCopied, copy } = useCopy(href);

	return (
		<>
			<button
				type="button"
				className={styles["copy-button"]}
				data-is-copied={isCopied}
				aria-label="copy url button"
				onClick={async () => {
					await copy(); // Copy url.
				}}
			>
				<span data-is-copied={isCopied}>URLをコピー</span>
				<span data-is-copied={isCopied}>
					しました
					<Check />
				</span>
				<span data-is-copied={isCopied}>
					する
					<Copy />
				</span>
			</button>
		</>
	);
};
