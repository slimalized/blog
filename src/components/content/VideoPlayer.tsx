import { Pause, Play } from "lucide-react";
import { useRef, useState } from "react";
import styles from "./VideoPlayer.module.css";

export const VideoPlayer = ({ src }: { src: string }) => {
	const [isPausing, setIsPausing] = useState(false);
	const videoRef = useRef<HTMLVideoElement>(null);

	const handleClick = () => {
		const video = videoRef.current;
		if (video) {
			if (video.paused) {
				video.play();
				setIsPausing(false);
			} else {
				video.pause();
				setIsPausing(true);
			}
		}
	};

	return (
		<div className={styles["video-player"]} data-is-pausing={isPausing}>
			<div className={styles["video-wrapper"]}>
				<video
					className={styles.video}
					ref={videoRef}
					autoPlay
					muted
					loop
					width={"100%"}
				>
					<source src={src} type="video/mp4" />
				</video>
			</div>
			<button
				className={styles["video-control-button"]}
				type="button"
				onClick={handleClick}
			>
				<div className={styles["icon-wrapper"]}>
					<Pause />
					<Play />
				</div>
			</button>
		</div>
	);
};
