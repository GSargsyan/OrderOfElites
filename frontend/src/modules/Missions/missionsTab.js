import React, { useState, useEffect } from 'react'
import { request } from 'modules/Base'

function MissionsTab() {
    console.log('MissionsTab rendered')
    const [data, setData] = useState(null)

    useEffect(() => {
        request({
            'url': 'missions/get_missions_tab_data',
            'method': 'POST',
        })
        .then(response => {
            console.log(response.data)
            setData(response.data)
        })
    }, [])

    if (data === null) {
        return <div>Loading...</div>
    }

    const startMission = (missionType) => {
        request({
            'url': `missions/start/${missionType}`,
            'method': 'POST',
        })
        .then(response => {
            console.log("Mission started:", response)
            this.forceUpdate()
        })
        .catch(error => {
            console.error("Error starting mission:", error)
        })
    }

    return (
        <>
        <div className="missionSection" style={styles.missionSection}> <h3>Stakeout</h3>
            <p>Keep your eyes peeled and monitor the target's activity. Gather crucial information and earn your reward.</p>

            <button
                className="doMissionBtn"
                disabled={!data.stakeout.allowed || (data.stakeout.cd_remaining && data.stakeout.cd_remaining > 0)}
                onClick={() => startMission('stakeout')}
            >
                Start
            </button>
            {data.stakeout.cd_remaining && data.stakeout.cd_remaining > 0 &&
                <span> {data.recon_op.cd_remaining}</span>
            }
        </div>

        <div className="missionSection" style={styles.missionSection}>
            <h3>Recon Op</h3>
            <p>Go undercover, gather intelligence from strategic points. Stay undetected and relay the information.</p>

            <button
                className="doMissionBtn"
                disabled={!data.recon_op.allowed || (data.recon_op.cd_remaining && data.recon_op.cd_remaining > 0)}
                onClick={() => startMission('recon_op')}
            >
                Start
            </button>
            {data.recon_op.cd_remaining && data.recon_op.cd_remaining > 0 &&
                <span> {data.recon_op.cd_remaining}</span>
            }
        </div>
        </>
    )
}

const styles = {
}

export default MissionsTab