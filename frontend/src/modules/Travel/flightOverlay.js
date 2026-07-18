import React, { useEffect, useRef } from 'react'

import flightVideo from 'assets/videos/flight_in_progress.mp4'
import flightSound from 'assets/sound/airplane_sound_effect.mp3'

/**
 * FlightOverlay
 * Rendered inside .central-panel when the user is in-flight and clicks a blocked tab.
 * The video is non-interactive (no controls, no pause, no click).
 * Audio plays on mount and stops on unmount.
 */
function FlightOverlay() {
    const audioRef = useRef(null)
    const playCountRef = useRef(0)

    // Start audio on mount, stop on unmount
    useEffect(() => {
        const audio = new Audio(flightSound)
        audio.loop = false
        audio.volume = 0.4
        audioRef.current = audio

        // Autoplay with sound requires prior user interaction — this fires
        // after the user clicked a tab, so it's allowed.
        audio.play().catch(() => {
            // Silently ignore if blocked (e.g. no prior interaction)
        })

        return () => {
            audio.pause()
            audio.src = ''
        }
    }, [])

    const handleVideoEnded = (e) => {
        playCountRef.current += 1
        if (playCountRef.current < 2) {
            e.target.play().catch(err => {
                console.error('Video replay failed:', err)
            })
        }
    }

    return (
        <div className="flight-overlay">
            {/* Non-interactive looping video */}
            <video
                className="flight-overlay-video"
                src={flightVideo}
                autoPlay
                muted
                playsInline
                disablePictureInPicture
                disableRemotePlayback
                onContextMenu={e => e.preventDefault()}
                onEnded={handleVideoEnded}
            />
        </div>
    )
}

export default FlightOverlay
