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

    const [extractionData, setExtractionData] = useState(null)
    const [extractionCdRemaining, setExtractionCdRemaining] = useState(0)
    const [inviteUsername, setInviteUsername] = useState('')
    const [selectedCar, setSelectedCar] = useState('')

    const { updateUserPreviewData } = useContext(UserPreviewCtx)

    const loadMissionsData = () => {
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

                setExtractionData(response.data.extraction)
                setExtractionCdRemaining(secondsRemaining(response.data.extraction.cd_remaining))
            })
            .catch(error => {
                console.error("Error getting missions tab data: ", error)
            })
    }

    useEffect(() => {
        loadMissionsData()
    }, [])

    useEffect(() => {
        if (!missionsData) return

        const interval = setInterval(() => {
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

            if (extractionCdRemaining > 0) {
                setExtractionCdRemaining(cd => cd - 1)
            }
        }, 1000)

        return () => clearInterval(interval);
    }, [stakeoutCdRemaining, reconOpCdRemaining, extractionCdRemaining,
        isReconOpAllowed, isStakeoutAllowed, missionsData])

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

    const extractionAction = (action, payload = {}) => {
        console.log(`missions/extraction/${action}`)
        request({
            'url': `missions/extraction/${action}`,
            'method': 'POST',
            'data': payload,
        })
            .then(response => {
                if (action === 'start') {
                    alert(`Extraction complete! You earned $${response.data.reward.toLocaleString('en-US')} ` +
                        `and ${response.data.exp_reward} EXP.`)
                    updateUserPreviewData()
                }
                setSelectedCar('')
                loadMissionsData()
            })
            .catch(error => {
                console.error("Error on extraction action:", error)
                const message = (error.response && error.response.data && error.response.data.message)
                    || 'Something went wrong'
                alert(message)
                loadMissionsData()
            })
    }

    const sendInvite = () => {
        extractionAction('invite', { 'username': inviteUsername })
        setInviteUsername('')
    }

    const renderExtractionIdle = () => {
        if (extractionCdRemaining > 0) {
            return (
                <p className="extraction-note">
                    Lay low for now. The Order will have another extraction for you soon.
                </p>
            )
        }

        return (
            <div className="extraction-sections">
                <div className="extraction-section">
                    <h4>Host an Extraction</h4>
                    <p className="extraction-note">
                        Recruit a driver in your city. The payout goes to you,
                        both of you earn experience.
                    </p>
                    <div className="extraction-invite-row">
                        <input
                            className="extraction-input"
                            type="text"
                            placeholder="Driver's name"
                            autoComplete="new-password"
                            value={inviteUsername}
                            onChange={e => setInviteUsername(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') sendInvite() }}
                        />
                        <button
                            className="btn-mission-start"
                            disabled={!inviteUsername.trim()}
                            onClick={sendInvite}
                        >
                            Invite
                        </button>
                    </div>
                </div>

                <div className="extraction-section">
                    <h4>Invitations</h4>
                    {extractionData.invitations.length === 0 ? (
                        <p className="extraction-note">No invitations at the moment.</p>
                    ) : (
                        extractionData.invitations.map(inv => (
                            <div className="extraction-invitation-row" key={inv.id}>
                                <span className="extraction-invitation-name">{inv.initiator}</span>
                                <div className="extraction-invitation-actions">
                                    <button
                                        className="btn-extraction-small"
                                        onClick={() => extractionAction('accept', { 'mission_id': inv.id })}
                                    >
                                        Accept
                                    </button>
                                    <button
                                        className="btn-extraction-small btn-extraction-danger"
                                        onClick={() => extractionAction('reject', { 'mission_id': inv.id })}
                                    >
                                        Reject
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        )
    }

    const renderExtractionActive = () => {
        const mission = extractionData.mission

        // initiator waiting for the driver to accept
        if (mission.status === 'invited') {
            return (
                <div className="extraction-pending">
                    <p className="extraction-note">
                        Invitation sent to <span className="extraction-highlight">{mission.driver}</span>.
                        Awaiting their response…
                    </p>
                    <button
                        className="btn-extraction-small btn-extraction-danger"
                        onClick={() => extractionAction('cancel', { 'mission_id': mission.id })}
                    >
                        Withdraw
                    </button>
                </div>
            )
        }

        const isDriver = mission.role === 'driver'

        return (
            <div className="extraction-setup">
                <div className="extraction-roster">
                    <div className="extraction-roster-row">
                        <span className="extraction-label">Initiator</span>
                        <span>{mission.initiator}{!isDriver && ' (you)'}</span>
                    </div>
                    <div className="extraction-roster-row">
                        <span className="extraction-label">Driver</span>
                        <span>{mission.driver}{isDriver && ' (you)'}</span>
                    </div>
                    <div className="extraction-roster-row">
                        <span className="extraction-label">Car</span>
                        <span>{mission.car_name || '—'}</span>
                    </div>
                    <div className="extraction-roster-row">
                        <span className="extraction-label">Status</span>
                        <span className={mission.status === 'ready' ? 'extraction-highlight' : ''}>
                            {mission.status === 'ready' ? 'Driver is ready' : 'Waiting for the driver'}
                        </span>
                    </div>
                </div>

                {isDriver && mission.status === 'accepted' && (
                    extractionData.cars.length === 0 ? (
                        <p className="extraction-note">
                            You don't own a car in this city. Get one to drive this mission.
                        </p>
                    ) : (
                        <div className="extraction-driver-panel">
                            <p className="extraction-note">
                                The car you choose will be consumed by the mission — you will lose it.
                            </p>
                            <div className="extraction-invite-row">
                                <select
                                    className="extraction-input"
                                    value={selectedCar}
                                    onChange={e => setSelectedCar(e.target.value)}
                                >
                                    <option value="">Choose a car…</option>
                                    {extractionData.cars.map(car => (
                                        <option key={car.key} value={car.key}>{car.name}</option>
                                    ))}
                                </select>
                                <button
                                    className="btn-mission-start"
                                    disabled={!selectedCar}
                                    onClick={() => extractionAction('ready', {
                                        'mission_id': mission.id,
                                        'car': selectedCar,
                                    })}
                                >
                                    Ready
                                </button>
                            </div>
                        </div>
                    )
                )}

                {isDriver && mission.status === 'ready' && (
                    <p className="extraction-note">
                        You are ready. Waiting for the Initiator to start the mission.
                    </p>
                )}

                <div className="extraction-actions">
                    {!isDriver && (
                        <button
                            className="btn-mission-start"
                            disabled={mission.status !== 'ready'}
                            onClick={() => extractionAction('start', { 'mission_id': mission.id })}
                        >
                            Start
                        </button>
                    )}
                    {isDriver && mission.status === 'ready' && (
                        <button
                            className="btn-extraction-small"
                            onClick={() => extractionAction('unready', { 'mission_id': mission.id })}
                        >
                            Not Ready
                        </button>
                    )}
                    <button
                        className="btn-extraction-small btn-extraction-danger"
                        onClick={() => extractionAction('cancel', { 'mission_id': mission.id })}
                    >
                        Abort
                    </button>
                </div>
            </div>
        )
    }

    const renderExtractionBody = () => {
        if (!extractionData.allowed) {
            return <p className="extraction-note">Unlocks at Rank 5.</p>
        }

        return extractionData.mode === 'active'
            ? renderExtractionActive()
            : renderExtractionIdle()
    }

    if (missionsData === null) {
        return <div className="loading-text">LOADING MISSIONS...</div>
    }

    return (
        <div className="missions-grid">
            {/* Stakeout Mission Card */}
            <div className="mission-card">
                <div className="mission-card-header">
                    <h3>Stakeout</h3>
                    {stakeoutCdRemaining > 0 && (
                        <div className="mission-timer">
                            <span className="timer-icon">⏱</span>
                            {formatSeconds(stakeoutCdRemaining)}
                        </div>
                    )}
                </div>
                <p>
                    Keep your eyes peeled and monitor the target's activity.
                    Gather crucial information and earn your reward.
                </p>
                <button
                    className="btn-mission-start"
                    disabled={!isStakeoutAvailable}
                    onClick={() => startMission('stakeout')}
                >
                    Start
                </button>
            </div>

            {/* Recon Op Mission Card */}
            <div className="mission-card">
                <div className="mission-card-header">
                    <h3>Recon Op</h3>
                    {reconOpCdRemaining > 0 && (
                        <div className="mission-timer">
                            <span className="timer-icon">⏱</span>
                            {formatSeconds(reconOpCdRemaining)}
                        </div>
                    )}
                </div>
                <p>
                    Go undercover, gather intelligence from strategic points.
                    Stay undetected and relay the information.
                </p>
                <button
                    className="btn-mission-start"
                    disabled={!isReconOpAvailable}
                    onClick={() => startMission('recon_op')}
                >
                    Start
                </button>
            </div>

            {/* Extraction Mission Card */}
            <div className="mission-card mission-card-extraction">
                <div className="mission-card-header">
                    <h3>Extraction</h3>
                    {extractionCdRemaining > 0 && (
                        <div className="mission-timer">
                            <span className="timer-icon">⏱</span>
                            {formatSeconds(extractionCdRemaining)}
                        </div>
                    )}
                </div>
                <p>
                    Two Elites, one job. An Initiator recruits a Driver in their city
                    and gets the target out clean. The Order pays well for a flawless
                    extraction — but the getaway car never comes back.
                </p>
                {renderExtractionBody()}
            </div>
        </div>
    )
}

export default MissionsTab
