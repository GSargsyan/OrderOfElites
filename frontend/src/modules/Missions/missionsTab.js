import React, { useState, useEffect, useContext } from 'react'
import { request, formatSeconds, secondsRemaining } from 'modules/Base'
import { UserPreviewCtx } from 'modules/Dashboard'

function MissionsTab() {
    console.log('MissionsTab rendered')
    const [missionsData, setMissionsData] = useState(null)
    const [isStakeoutAvailable, setIsStakeoutAvailable] = useState(false)
    const [isReconOpAvailable, setIsReconOpAvailable] = useState(false)
    const [stakeoutCdRemaining, setStakeoutCdRemaining] = useState(0)
    const [reconOpCdRemaining, setReconOpCdRemaining] = useState(0)
    const [isStakeoutAllowed, setIsStakeoutAllowed] = useState(false)
    const [isReconOpAllowed, setIsReconOpAllowed] = useState(false)

    const { userPreviewData, updateUserPreviewData } = useContext(UserPreviewCtx)

    useEffect(() => {
        request({
            'url': 'missions/get_missions_tab_data',
            'method': 'POST',
        })
        .then(response => {
            console.log('missions/get_missions_tab_data')
            setMissionsData(response.data)

            setIsStakeoutAllowed(response.data.stakeout.allowed)
            setIsReconOpAllowed(response.data.recon_op.allowed)

            setStakeoutCdRemaining(secondsRemaining(response.data.stakeout.cd_remaining))
            setReconOpCdRemaining(secondsRemaining(response.data.recon_op.cd_remaining))

            setIsStakeoutAvailable(response.data.stakeout.allowed &&
                secondsRemaining(response.data.stakeout.cd_remaining) <= 0)

            setIsReconOpAvailable(response.data.recon_op.allowed &&
                secondsRemaining(response.data.recon_op.cd_remaining) <= 0)
        })
        .catch(error => {
            console.error("Error getting missions tab data: ", error)
        })
    }, [])

    useEffect(() => {
        console.log(missionsData)
        if (!missionsData) return


        const interval = setInterval(() => {
            console.log(stakeoutCdRemaining)

            if (stakeoutCdRemaining > 0) {
                setStakeoutCdRemaining(cd => {
                    setIsStakeoutAvailable(isStakeoutAllowed && cd - 1 <= 0)
                    return cd - 1
                })
            }

            if (reconOpCdRemaining > 0) {
                setReconOpCdRemaining(cd => {
                    setIsReconOpAvailable(isReconOpAllowed && cd - 1 <= 0)
                    return cd - 1
                })
            }
        }, 1000)

        return () => clearInterval(interval);
    }, [stakeoutCdRemaining, reconOpCdRemaining, isReconOpAllowed, isStakeoutAllowed])

    const startMission = (missionType) => {
        console.log(`missions/start/${missionType}`)
        request({
            'url': `missions/start/${missionType}`,
            'method': 'POST',
        })
        .then(response => {
            updateUserPreviewData()

            if (missionType === 'stakeout') {
                setIsStakeoutAvailable(false)
                setStakeoutCdRemaining(secondsRemaining(response.data.cd_remaining))
            } else if (missionType === 'recon_op') {
                setIsReconOpAvailable(false)
                setReconOpCdRemaining(secondsRemaining(response.data.cd_remaining))
            }
        })
        .catch(error => {
            console.error("Error starting mission:", error)
        })
    }

    if (missionsData === null) {
        return <div>Loading...</div>
    }

    return (
        <>
        <div className="missionSection" style={styles.missionSection}> <h3>Stakeout</h3>
            <p>Keep your eyes peeled and monitor the target's activity. Gather crucial information and earn your reward.</p>

            <button
                className="doMissionBtn"
                disabled={!isStakeoutAvailable}
                onClick={() => startMission('stakeout')}
            >
                Start
            </button>
            {stakeoutCdRemaining > 0 &&
                <span> {formatSeconds(stakeoutCdRemaining)}</span>
            }
        </div>

        <div className="missionSection" style={styles.missionSection}>
            <h3>Recon Op</h3>
            <p>Go undercover, gather intelligence from strategic points. Stay undetected and relay the information.</p>

            <button
                className="doMissionBtn"
                disabled={!isReconOpAvailable}
                onClick={() => startMission('recon_op')}
            >
                Start
            </button>
            {reconOpCdRemaining > 0 &&
                <span> {formatSeconds(reconOpCdRemaining)}</span>
            }
        </div>
        </>
    )
}

const styles = {
}

export default MissionsTab